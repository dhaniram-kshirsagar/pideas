const auth = firebase.auth();
const firestore = firebase.firestore();
const ai = firebase.vertexAI();

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
  const model = ai.getGenerativeModel({ model: 'gemini-pro' });
  const ideaPrompt = `Generate a project idea based on this query: ${query}`;
  const ideaResult = await model.generateContent(ideaPrompt);
  const ideaResponse = await ideaResult.response;
  ideaContainer.textContent = ideaResponse.text();
});
