# Screenshots via Windows Edge (used while Playwright's Chromium cannot start in WSL).
# Usage: powershell -File scripts/shots.ps1 -Out <dir> -Base http://localhost:5199
param([string]$Out, [string]$Base = 'http://localhost:5199')
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$jobs = @(
  @('home-desktop', '/', '1440,2300'), @('home-mobile', '/', '390,2600'),
  @('shop-desktop', '/shop', '1440,2000'), @('shop-mobile', '/shop', '390,2000'),
  @('product-desktop', '/shop/p-002', '1440,1400'), @('product-mobile', '/shop/p-002', '390,2200')
)
foreach ($j in $jobs) {
  Start-Process $edge -ArgumentList '--headless=new', '--disable-gpu', '--hide-scrollbars', "--window-size=$($j[2])", '--virtual-time-budget=10000', "--screenshot=$Out\$($j[0]).png", "$Base$($j[1])" -Wait -NoNewWindow 2>$null | Out-Null
}
Get-ChildItem $Out -Filter *.png | Select-Object Name, Length
