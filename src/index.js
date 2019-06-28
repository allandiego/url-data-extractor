const robots = {
  rbc: require('./rbc.js'),
  rble: require('./rble.js')
}

async function main() {
  console.log(`> [MAIN]: Starting Robots`)
  await robots.rbc()
  await robots.rble()
}

main().catch(console.error);
