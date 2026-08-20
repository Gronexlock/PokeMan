# Script de prueba de conexión PokéAPI
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $resp = Invoke-RestMethod -Uri "https://pokeapi.co/api/v2/type/1" -TimeoutSec 10
    Write-Host "Conectado exitosamente con PokéAPI: Tipo $($resp.name)"
} catch {
    Write-Host "Fallo de conexión: $($_.Exception.Message)"
}
