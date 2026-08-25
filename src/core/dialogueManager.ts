import { DialogueTree, DialogueNode, DialogueChoice } from './types';

export interface DialogueState {
  isActive: boolean;
  treeId: string | null;
  currentNode: DialogueNode | null;
  displayedText: string;
  isTextComplete: boolean;
  charIndex: number;
  selectedChoiceIndex: number;
  onFinishedCallback?: (flags: Record<string, any>) => void;
  flags: Record<string, any>;
}

export class DialogueManager {
  private dialoguesDb: Record<string, DialogueTree> = {};
  public state: DialogueState = {
    isActive: false,
    treeId: null,
    currentNode: null,
    displayedText: "",
    isTextComplete: true,
    charIndex: 0,
    selectedChoiceIndex: 0,
    flags: {}
  };

  private textSpeed: number = 30; // caracteres por segundo
  private elapsedSinceChar: number = 0;

  constructor(dialoguesDb: Record<string, any> = {}) {
    this.dialoguesDb = dialoguesDb.dialogues || dialoguesDb;
  }

  public setDialoguesDb(dialoguesDb: Record<string, any>) {
    this.dialoguesDb = dialoguesDb.dialogues || dialoguesDb;
  }

  public startDialogue(
    treeIdOrTree: string | DialogueTree,
    startNodeIdOrSpeaker?: string,
    onFinished?: (flags: Record<string, any>) => void
  ): boolean {
    let tree: DialogueTree | undefined;
    if (typeof treeIdOrTree === 'string') {
      tree = this.dialoguesDb[treeIdOrTree];
      if (!tree) {
        // Fallback: simple text dialogue
        this.state = {
          isActive: true,
          treeId: 'ad_hoc',
          currentNode: {
            node_id: '1',
            speaker: startNodeIdOrSpeaker || 'Info',
            text: treeIdOrTree
          },
          displayedText: '',
          isTextComplete: false,
          charIndex: 0,
          selectedChoiceIndex: 0,
          onFinishedCallback: onFinished,
          flags: {}
        };
        return true;
      }
    } else {
      tree = treeIdOrTree;
    }

    const firstNode = startNodeIdOrSpeaker
      ? tree.nodes.find(n => n.node_id === startNodeIdOrSpeaker) || tree.nodes[0]
      : tree.nodes[0];

    if (!firstNode) return false;

    this.state.isActive = true;
    this.state.treeId = tree.id;
    this.state.currentNode = firstNode;
    this.state.displayedText = "";
    this.state.isTextComplete = false;
    this.state.charIndex = 0;
    this.state.selectedChoiceIndex = 0;
    this.state.onFinishedCallback = onFinished;
    this.elapsedSinceChar = 0;

    if (firstNode.set_flag) {
      Object.assign(this.state.flags, firstNode.set_flag);
    }

    return true;
  }

  public update(dt: number): void {
    if (!this.state.isActive || !this.state.currentNode || this.state.isTextComplete) {
      return;
    }

    const fullText = this.state.currentNode.text;
    this.elapsedSinceChar += dt;

    const charTime = 1 / this.textSpeed;
    while (this.elapsedSinceChar >= charTime && this.state.charIndex < fullText.length) {
      this.state.charIndex++;
      this.state.displayedText = fullText.slice(0, this.state.charIndex);
      this.elapsedSinceChar -= charTime;
    }

    if (this.state.charIndex >= fullText.length) {
      this.state.isTextComplete = true;
    }
  }

  public advance(): { finished: boolean; triggerBattle?: string; choiceMade?: string } {
    if (!this.state.isActive || !this.state.currentNode) {
      return { finished: true };
    }

    // 1. Si el texto no ha terminado de escribirse, completarlo al instante
    if (!this.state.isTextComplete) {
      this.state.displayedText = this.state.currentNode.text;
      this.state.charIndex = this.state.currentNode.text.length;
      this.state.isTextComplete = true;
      return { finished: false };
    }

    // 2. Si el nodo tiene opciones, seleccionar la activa
    const node = this.state.currentNode;
    if (node.choices && node.choices.length > 0) {
      const choice = node.choices[this.state.selectedChoiceIndex];
      if (choice) {
        this.state.flags[node.node_id + '_choice'] = choice.choice_key;
        return this.goToNode(choice.next_node, choice.choice_key);
      }
    }

    // 3. Si tiene siguiente nodo
    if (node.next_node) {
      return this.goToNode(node.next_node);
    }

    // 4. Fin del árbol de diálogo
    return this.closeDialogue();
  }

  public selectChoiceUp(): void {
    if (this.state.currentNode?.choices) {
      this.state.selectedChoiceIndex = Math.max(0, this.state.selectedChoiceIndex - 1);
    }
  }

  public selectChoiceDown(): void {
    if (this.state.currentNode?.choices) {
      this.state.selectedChoiceIndex = Math.min(
        this.state.currentNode.choices.length - 1,
        this.state.selectedChoiceIndex + 1
      );
    }
  }

  private goToNode(nextNodeId: string, choiceKey?: string): { finished: boolean; triggerBattle?: string; choiceMade?: string } {
    if (!this.state.treeId || !this.dialoguesDb[this.state.treeId]) {
      return this.closeDialogue();
    }

    const tree = this.dialoguesDb[this.state.treeId];
    const nextNode = tree.nodes.find(n => n.node_id === nextNodeId);

    if (!nextNode) {
      return this.closeDialogue();
    }

    this.state.currentNode = nextNode;
    this.state.displayedText = "";
    this.state.isTextComplete = false;
    this.state.charIndex = 0;
    this.state.selectedChoiceIndex = 0;
    this.elapsedSinceChar = 0;

    if (nextNode.set_flag) {
      Object.assign(this.state.flags, nextNode.set_flag);
    }

    let triggerBattle: string | undefined;
    if (nextNode.trigger_battle) {
      triggerBattle = nextNode.trigger_battle.trainer_id;
    }

    return { finished: false, triggerBattle, choiceMade: choiceKey };
  }

  private closeDialogue(): { finished: boolean; triggerBattle?: string } {
    const flags = { ...this.state.flags };
    const cb = this.state.onFinishedCallback;
    const triggerBattle = this.state.currentNode?.trigger_battle?.trainer_id;

    this.state.isActive = false;
    this.state.treeId = null;
    this.state.currentNode = null;
    this.state.displayedText = "";

    if (cb) {
      cb(flags);
    }

    return { finished: true, triggerBattle };
  }
}
