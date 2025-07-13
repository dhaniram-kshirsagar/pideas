const auth = firebase.auth();
const firestore = firebase.firestore();
const functions = firebase.functions();

const loginButton = document.getElementById('login-button');
const appContainer = document.getElementById('app-container');
const loginContainer = document.getElementById('login-container');
const userName = document.getElementById('user-name');
const lastQuery = document.getElementById('last-query');
const queryInput = document.getElementById('query-input');
const generateButton = document.getElementById('generate-button');
const ideaContainer = document.getElementById('idea-container');

let user;

// Authentication
loginButton.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => {
      user = result.user;
      appContainer.style.display = 'block';
      loginContainer.style.display = 'none';
      loadUserProfile();
    })
    .catch((error) => {
      console.error('Authentication error:', error);
    });
});

// Load user profile
function loadUserProfile() {
  userName.textContent = `Welcome, ${user.displayName}!`;
  firestore.collection('users').doc(user.uid).get()
    .then((doc) => {
      if (doc.exists) {
        lastQuery.textContent = `Last query: ${doc.data().lastQuery}`;
      }
    });
}

// Generate project idea
generateButton.addEventListener('click', async () => {
  const query = queryInput.value;
  if (!query) return;

  // Save the query to the user's profile
  firestore.collection('users').doc(user.uid).set({
    lastQuery: query,
    name: user.displayName,
    email: user.email,
  }, { merge: true });
  lastQuery.textContent = `Last query: ${query}`;

  // Generate the project idea
  ideaContainer.textContent = 'Generating idea...';
  
  try {
    // Call the Cloud Function that handles the Gemini API
    const generateIdea = functions.httpsCallable('generateIdea');
    const result = await generateIdea({ query: query });
    
    // Display the result
    ideaContainer.textContent = result.data.idea || 'Could not generate idea. Please try again.';
  } catch (error) {
    console.error('Error generating idea:', error);
    ideaContainer.textContent = 'Error: ' + error.message;
  }
});
