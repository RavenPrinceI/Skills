export function parseArgs(args){
  const options={episode:'episode.json',output:'out',format:'both',concurrency:2,stills:false,validate:false,release:false};
  for(let i=0;i<args.length;i++){
    const name=args[i];
    if(['--stills','--validate','--release'].includes(name)){options[name.slice(2)]=true;continue;}
    if(!['--episode','--output','--format','--sample','--frames','--concurrency'].includes(name))throw new Error(`Unknown option: ${name}`);
    const value=args[++i];if(!value||value.startsWith('--'))throw new Error(`Missing value for ${name}`);
    options[name.slice(2)]=['--sample','--concurrency'].includes(name)?Number(value):value;
  }
  if(!['both','vertical','landscape'].includes(options.format))throw new Error('Format must be both, vertical or landscape');
  if(!Number.isInteger(options.concurrency)||options.concurrency<1)throw new Error('Concurrency must be a positive integer');
  if(options.sample!==undefined&&(!Number.isFinite(options.sample)||options.sample<=0))throw new Error('Sample must be positive seconds');
  if(options.frames){options.frames=options.frames.split(',').map(Number);if(options.frames.some(n=>!Number.isInteger(n)||n<0))throw new Error('Frames must be comma-separated nonnegative integers');}
  return options;
}
