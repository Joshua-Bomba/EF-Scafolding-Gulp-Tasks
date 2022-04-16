//in package.json
//{
// ...
// "scripts":
// {
//   "postinstall": "node build/vs-tsconfig-fix.js"
// }
// ...
//}

//packages have tsconfig.json commited which visual studio is looking for
//visual studio will find these and get very confused
//we are going to remove them
var path = require('path');
const fs = require('fs');

let rootDir = path.resolve(__dirname);

//let's use the package-lock.json or npm-shrinkwrap.json to find the location of all the modules
let lock = null;
if(fs.existsSync(path.join(rootDir,'package-lock.json')))
{
    lock = require('./package-lock.json');
}
else if(fs.existsSync(path.join(rootDir,'npm-shrinkwrap.json')))
{
    lock = require('./npm-shrinkwrap.json');
}

console.log('starting tsconfig.json cleanup');

//tsconfig.json are not always in the root
//I did have this using rimraf before but it was a bit slow
let additionaLocationsToLook = ['src','dist/lib'];


if(lock != null)
{
    if(typeof lock.packages !== 'undefined')
    {
        for(let packageKey in lock.packages)
        {
            if(packageKey.startsWith('node_modules')){
                let p = path.join(rootDir,packageKey,'tsconfig.json');
                if(fs.existsSync(p))
                {
                    console.log(`Deleted ${p}`);
                    fs.rmSync(p);
                }
                else{
                    //it checks those folders listed above for a tsconfig.json file
                    for(let i = 0;i < additionaLocationsToLook.length;i++)
                    {
                        p = path.join(rootDir,packageKey,additionaLocationsToLook[i],'tsconfig.json');
                        if(fs.existsSync(p))
                        {
                            console.log(`Deleted ${p}`);
                            fs.rmSync(p);
                            break;
                        }
                    }
                }
            }
        }
    }
    else{
        console.log('no packages found');
    }
}
else{
    console.log('No lock file found');
}


console.log('ending tsconfig.json cleanup');