
    const { runFirebaseGoalsTests } = require('./src/utils/firebaseTest.ts');
    
    runFirebaseGoalsTests()
      .then(() => {
        console.log('\n✅ Tests completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.log('\n❌ Tests failed:', error.message);
        process.exit(1);
      });
  