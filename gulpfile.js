//Packages
const del = require('del');
//var gulp = require('gulp');
var path = require('path');
let PowerShell = require('node-powershell');

let settings = require('./settings.json');

var ProjectFolder = path.resolve(__dirname, settings.EFProjectFolder);

var _contextProvider = settings.Provider;
var _contextClass = settings.ContextClassName;
var _namespace = settings.OutputNamespace;
var outputDir = settings.OutputDirectory;


function getConnectionString() {
    if (typeof settings.ConnectionString.value !== 'undefined' && settings.ConnectionString.value !== null) {
        return settings.ConnectionString.value;
    }
    else if (typeof settings.ConnectionString.refFile !== 'undefined') {
        let appSettings = require(path.join(ProjectFolder, settings.ConnectionString.refFile.fileLocation));
        let access = settings.ConnectionString.refFile.access;
        let con = appSettings;
        for (let i = 0; i < access.length; i++) {
            con = con[access[i]];
        }
        return con;
    }
    else {
        throw "No Connection String Found";
    }
}

//I Recommend you do this only when you are not reference any of the models 
//Think the scafolding needs the project to buld
async function cleanModelsFolder() {
    await del(path.join(ProjectFolder, `${outputDir}/*`), {force: true});
}

async function installScafoldDependencies() {
    let ps = new PowerShell.PowerShell({ debugMsg: false, spawnOptions: { cwd: ProjectFolder } });
    try {

        ps.streams.stdout.pipe(process.stdout);
        let pkgsToInstall = settings.Dependencies;
        for (let i = 0; i < pkgsToInstall.length; i++) {
            try {
                console.log(`running ${pkgsToInstall[i]}`);
                await ps.invoke(pkgsToInstall[i]);
            }
            catch {
                console.log("Exception throw, continuing ");
            }
        }
    }
    finally {
        ps.dispose();
    }
}

//this will overwrite any existing models so make partial classes somewhere else 
//don't modify the files directly
async function ScaffoldDbContext() {
    let ps = new PowerShell.PowerShell({ debugMsg: false, spawnOptions: { cwd: ProjectFolder } });

    try {
        let conString = getConnectionString();
        let str = `dotnet ef dbcontext scaffold "${conString}"  ${_contextProvider} -o "${outputDir}" -c "${_contextClass}" --context-namespace ${_namespace} -d --no-onconfiguring -f`;
        console.log(str);
        ps.streams.stdout.pipe(process.stdout);
        await ps.invoke(str);
    }
    finally {
        ps.dispose();
    }
}


exports.buildDbContext = ScaffoldDbContext;
exports.installScafoldDependencies = installScafoldDependencies;
exports.cleanModelsFolder = cleanModelsFolder;