const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, runTransaction, serverTimestamp } = require('firebase/firestore');

async function main() {
  const testEnv = await initializeTestEnvironment({
    projectId: 'demo-roomie-finder',
    firestore: { host: '127.0.0.1', port: 8080 },
  });

  const userAId = 'userA_' + Date.now();
  const userBId = 'userB_' + Date.now();

  const userAContext = testEnv.authenticatedContext(userAId, {
    email: 'usera@students.tukenya.ac.ke',
    email_verified: true
  });
  
  const userBContext = testEnv.authenticatedContext(userBId, {
    email: 'userb@students.tukenya.ac.ke',
    email_verified: true
  });

  const dbA = userAContext.firestore();
  const dbB = userBContext.firestore();

  // We need user profiles to exist because `validLikeDoc` checks participant users
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await setDoc(doc(adminDb, 'users', userAId), { id: userAId, studentId: '123' });
    await setDoc(doc(adminDb, 'users', userBId), { id: userBId, studentId: '456' });
  });

  const likeId = `${userAId}_${userBId}`;
  const reverseLikeId = `${userBId}_${userAId}`;
  const matchId = [userAId, userBId].sort().join('_');

  console.log(`Testing Transaction...`);
  console.log(`User A: ${userAId}`);
  console.log(`User B: ${userBId}`);
  console.log(`Like ID: ${likeId}`);

  // Step 1: User B likes User A (to setup the mutual like scenario)
  console.log(`User B liking User A...`);
  await runTransaction(dbB, async (transaction) => {
    transaction.set(doc(dbB, 'likes', reverseLikeId), {
      fromUid: userBId,
      toUid: userAId,
      createdAt: serverTimestamp()
    });
  }).catch(e => console.error("User B like failed:", e.message));

  // Step 2: User A likes User B, triggering a Match
  console.log(`User A liking User B (Expect Match)...`);
  try {
    await runTransaction(dbA, async (transaction) => {
      const likeRef = doc(dbA, 'likes', likeId);
      const reverseRef = doc(dbA, 'likes', reverseLikeId);
      const matchRef = doc(dbA, 'matches', matchId);
      const chatRef = doc(dbA, 'chats', matchId);

      // Check for reverse like
      const reverseDoc = await transaction.get(reverseRef);
      const reverseExists = reverseDoc.exists();
      
      // Perform matching logic
      if (reverseExists) {
        // Here we read the match doc (which is what fails in prod)
        await transaction.get(matchRef);
        
        transaction.set(matchRef, {
          participants: [userAId, userBId],
          status: 'matched', id: matchId, userA: userAId, userB: userBId, compatibilityVersion: 1, chatUnlocked: true,
          createdAt: serverTimestamp()
        });

        transaction.set(chatRef, {
          participants: [userAId, userBId],
          status: 'matched', id: matchId, userA: userAId, userB: userBId, compatibilityVersion: 1, chatUnlocked: true,
          updatedAt: serverTimestamp(),
          lastMessage: '',
          unreadBy: [] }, { merge: true }
        );
      }

      transaction.set(likeRef, {
        fromUid: userAId,
        toUid: userBId,
        createdAt: serverTimestamp()
      });
    });
    console.log("Transaction succeeded!");
  } catch (err) {
    console.error("Transaction failed!");
    console.error(err.message);
  }
}

main().catch(console.error);
