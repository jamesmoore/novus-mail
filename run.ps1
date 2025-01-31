npm i

cd front-react
# cd front
npm i
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Output "NPM build was successful"
}
else {
    Write-Error "NPM build was failed"
    cd ..
    exit
}

cd ..

npm run dev
