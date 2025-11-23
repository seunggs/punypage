#!/usr/bin/env bun

const getWorktreeId = (): number => {
  const cwd = process.cwd();
  const dirName = cwd.split('/').pop() || '';

  if (dirName === 'punypage') {
    return 0;
  }

  const match = dirName.match(/^punypage-(\d+)$/);
  if (match) {
    const id = parseInt(match[1], 10);
    if (isNaN(id) || id < 0) {
      console.error(`Error: Invalid worktree ID: ${match[1]}`);
      process.exit(1);
    }
    return id;
  }

  console.error(`Error: Invalid worktree directory name: ${dirName}`);
  console.error(`Expected 'punypage' or 'punypage-N' (e.g., 'punypage-1', 'punypage-2')`);
  process.exit(1);
};

const type = process.argv[2];
const worktreeId = getWorktreeId();

switch (type) {
  case 'frontend':
    console.log(6000 + worktreeId);
    break;
  case 'backend':
    console.log(4000 + worktreeId);
    break;
  case 'frontend-url':
    console.log(`http://localhost:${6000 + worktreeId}`);
    break;
  case 'backend-url':
    console.log(`http://localhost:${4000 + worktreeId}`);
    break;
  default:
    console.error(`Error: Invalid argument: ${type}`);
    console.error(`Usage: bun scripts/get-port.ts [frontend|backend|frontend-url|backend-url]`);
    process.exit(1);
}
