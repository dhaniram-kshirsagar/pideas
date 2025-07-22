// Main React App compiled for browser
const { useState, useEffect, useRef } = React;

// Login Component with Particles
function LoginWithParticles({ onLoginSuccess }) {
  const canvasRef = useRef(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const isTouchingRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Google Login Handler
  const handleGoogleLogin = async () => {
    if (!window.firebase) {
      setError('Firebase not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const auth = window.firebase.auth();
      const provider = new window.firebase.auth.GoogleAuthProvider();
      
      const result = await auth.signInWithPopup(provider);
      const user = result.user;
      
      if (user) {
        // Save user data to Firestore
        const firestore = window.firebase.firestore();
        await firestore.collection('users').doc(user.uid).set({
          name: user.displayName,
          email: user.email,
          lastLogin: new Date().toISOString()
        }, { merge: true });

        onLoginSuccess({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setIsMobile(window.innerWidth < 768);
    };

    updateCanvasSize();

    let particles = [];
    let textImageData = null;

    function createTextImage() {
      if (!ctx || !canvas) return 0;

      ctx.fillStyle = "white";
      ctx.save();

      // Set up text properties
      const fontSize = isMobile ? 40 : 80;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Draw "Project Idea Generator" text
      ctx.fillText("Project Idea Generator", canvas.width / 2, canvas.height / 2);

      ctx.restore();

      textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      return 1;
    }

    function createParticle(scale) {
      if (!ctx || !canvas || !textImageData) return null;

      const data = textImageData.data;

      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * canvas.width);
        const y = Math.floor(Math.random() * canvas.height);

        if (data[(y * canvas.width + x) * 4 + 3] > 128) {
          return {
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            size: Math.random() * 1 + 0.5,
            color: "white",
            scatteredColor: "#00DCFF",
            isAWS: false,
            life: Math.random() * 100 + 50,
          };
        }
      }

      return null;
    }

    function createInitialParticles(scale) {
      const baseParticleCount = 7000;
      const particleCount = Math.floor(baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)));
      for (let i = 0; i < particleCount; i++) {
        const particle = createParticle(scale);
        if (particle) particles.push(particle);
      }
    }

    let animationFrameId;

    function animate(scale) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const { x: mouseX, y: mouseY } = mousePositionRef.current;
      const maxDistance = 240;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance && (isTouchingRef.current || !("ontouchstart" in window))) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          const moveX = Math.cos(angle) * force * 60;
          const moveY = Math.sin(angle) * force * 60;
          p.x = p.baseX - moveX;
          p.y = p.baseY - moveY;

          ctx.fillStyle = p.scatteredColor;
        } else {
          p.x += (p.baseX - p.x) * 0.1;
          p.y += (p.baseY - p.y) * 0.1;
          ctx.fillStyle = "white";
        }

        ctx.fillRect(p.x, p.y, p.size, p.size);

        p.life--;
        if (p.life <= 0) {
          const newParticle = createParticle(scale);
          if (newParticle) {
            particles[i] = newParticle;
          } else {
            particles.splice(i, 1);
            i--;
          }
        }
      }

      const baseParticleCount = 7000;
      const targetParticleCount = Math.floor(
        baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)),
      );
      while (particles.length < targetParticleCount) {
        const newParticle = createParticle(scale);
        if (newParticle) particles.push(newParticle);
      }

      animationFrameId = requestAnimationFrame(() => animate(scale));
    }

    const scale = createTextImage();
    createInitialParticles(scale);
    animate(scale);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mousePositionRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      mousePositionRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mousePositionRef.current = { x: -1000, y: -1000 };
    };

    const handleTouchStart = () => {
      isTouchingRef.current = true;
    };

    const handleTouchEnd = () => {
      isTouchingRef.current = false;
      mousePositionRef.current = { x: -1000, y: -1000 };
    };

    const handleResize = () => {
      updateCanvasSize();
      const newScale = createTextImage();
      particles = [];
      createInitialParticles(newScale);
    };

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMobile]);

  return React.createElement('div', {
    className: "relative w-full h-screen flex flex-col items-center justify-center bg-black"
  }, [
    React.createElement('canvas', {
      key: 'canvas',
      ref: canvasRef,
      className: "w-full h-full absolute top-0 left-0 touch-none",
      'aria-label': "Interactive particle effect with Project Idea Generator text"
    }),
    React.createElement('div', {
      key: 'content',
      className: "absolute bottom-24 text-center z-10"
    }, [
      React.createElement('h2', {
        key: 'title',
        className: "text-white text-2xl font-semibold mb-2"
      }, "Welcome to Project Idea Generator"),
      React.createElement('p', {
        key: 'subtitle',
        className: "font-mono text-gray-400 text-sm mb-6"
      }, "Generate amazing project ideas with AI"),
      error && React.createElement('div', {
        key: 'error',
        className: "bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-md mb-4"
      }, error),
      React.createElement('button', {
        key: 'button',
        onClick: handleGoogleLogin,
        disabled: isLoading,
        className: "bg-white hover:bg-gray-100 disabled:bg-gray-300 text-black font-medium py-3 px-6 rounded-md flex items-center gap-3 mx-auto transition-colors duration-200 disabled:cursor-not-allowed"
      }, [
        isLoading ? React.createElement('div', {
          key: 'spinner',
          className: "animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"
        }) : React.createElement('svg', {
          key: 'google-icon',
          width: "20",
          height: "20",
          viewBox: "0 0 24 24",
          fill: "none"
        }, [
          React.createElement('path', {
            key: 'path1',
            d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z",
            fill: "#4285F4"
          }),
          React.createElement('path', {
            key: 'path2',
            d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z",
            fill: "#34A853"
          }),
          React.createElement('path', {
            key: 'path3',
            d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z",
            fill: "#FBBC05"
          }),
          React.createElement('path', {
            key: 'path4',
            d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z",
            fill: "#EA4335"
          })
        ]),
        React.createElement('span', { key: 'text' }, isLoading ? 'Signing in...' : 'Login with Google')
      ])
    ])
  ]);
}

// Main Project Idea App
function ProjectIdeaApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [projectIdea, setProjectIdea] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  // Initialize Firebase Auth listener
  useEffect(() => {
    if (!window.firebase) {
      setLoading(false);
      return;
    }

    const auth = window.firebase.auth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email
        });
        loadUserProfile(user.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (uid) => {
    try {
      const firestore = window.firebase.firestore();
      const doc = await firestore.collection('users').doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        setLastQuery(data.lastQuery || "");
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleLogin = (user) => {
    setUser(user);
  };

  const handleLogout = async () => {
    try {
      const auth = window.firebase.auth();
      await auth.signOut();
      setUser(null);
      setProjectIdea(null);
      setQuery("");
      setLastQuery("");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const generateProjectIdea = async () => {
    if (!query.trim() || !user) return;

    setGenerating(true);
    try {
      // Save query to user profile
      const firestore = window.firebase.firestore();
      await firestore.collection('users').doc(user.uid).set({
        lastQuery: query,
        name: user.displayName,
        email: user.email,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      // Call Firebase function to generate idea
      const functions = window.firebase.functions();
      const generateIdea = functions.httpsCallable('generateProjectIdea');
      
      const result = await generateIdea({ query });
      setProjectIdea(result.data);
      setLastQuery(query);
    } catch (error) {
      console.error('Error generating project idea:', error);
      // Fallback mock data for development
      setProjectIdea({
        title: `${query} Project`,
        description: `A comprehensive project based on your query: "${query}". This project would involve modern technologies and best practices.`,
        technologies: ["React", "Node.js", "Firebase", "TypeScript"],
        difficulty: "Intermediate"
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return React.createElement('div', {
      className: "min-h-screen bg-black flex items-center justify-center"
    }, React.createElement('div', {
      className: "animate-spin rounded-full h-12 w-12 border-b-2 border-white"
    }));
  }

  if (!user) {
    return React.createElement(LoginWithParticles, { onLoginSuccess: handleLogin });
  }

  return React.createElement('div', {
    className: "min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800"
  }, [
    // Header
    React.createElement('header', {
      key: 'header',
      className: "bg-black/50 backdrop-blur-sm border-b border-gray-800"
    }, React.createElement('div', {
      className: "max-w-6xl mx-auto px-4 py-4 flex justify-between items-center"
    }, [
      React.createElement('h1', {
        key: 'title',
        className: "text-2xl font-bold text-white"
      }, "Project Idea Generator"),
      React.createElement('div', {
        key: 'user-info',
        className: "flex items-center gap-4"
      }, [
        React.createElement('span', {
          key: 'welcome',
          className: "text-gray-300"
        }, `Welcome, ${user.displayName}!`),
        React.createElement('button', {
          key: 'logout',
          onClick: handleLogout,
          className: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
        }, "Logout")
      ])
    ])),
    
    // Main Content
    React.createElement('main', {
      key: 'main',
      className: "max-w-4xl mx-auto px-4 py-8"
    }, [
      lastQuery && React.createElement('div', {
        key: 'last-query',
        className: "mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
      }, React.createElement('p', {
        className: "text-gray-300"
      }, [
        React.createElement('span', {
          key: 'label',
          className: "text-cyan-400"
        }, "Last query: "),
        lastQuery
      ])),
      
      // Query Input
      React.createElement('div', {
        key: 'input-section',
        className: "mb-8"
      }, [
        React.createElement('label', {
          key: 'label',
          htmlFor: "query",
          className: "block text-white text-lg font-medium mb-4"
        }, "What kind of project would you like to build?"),
        React.createElement('div', {
          key: 'input-container',
          className: "flex gap-4"
        }, [
          React.createElement('textarea', {
            key: 'textarea',
            id: "query",
            value: query,
            onChange: (e) => setQuery(e.target.value),
            placeholder: "e.g., A web app for managing personal finances with charts and budgeting tools",
            className: "flex-1 p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none",
            rows: 3
          }),
          React.createElement('button', {
            key: 'generate-btn',
            onClick: generateProjectIdea,
            disabled: generating || !query.trim(),
            className: "bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2"
          }, generating ? [
            React.createElement('div', {
              key: 'spinner',
              className: "animate-spin rounded-full h-5 w-5 border-b-2 border-white"
            }),
            'Generating...'
          ] : 'Generate Idea')
        ])
      ]),
      
      // Project Idea Display
      projectIdea && React.createElement('div', {
        key: 'project-idea',
        className: "bg-gray-800/50 border border-gray-700 rounded-lg p-6"
      }, [
        React.createElement('h2', {
          key: 'project-title',
          className: "text-2xl font-bold text-white mb-4"
        }, projectIdea.title),
        React.createElement('p', {
          key: 'project-description',
          className: "text-gray-300 mb-6 leading-relaxed"
        }, projectIdea.description),
        React.createElement('div', {
          key: 'project-details',
          className: "grid md:grid-cols-2 gap-6"
        }, [
          React.createElement('div', {
            key: 'technologies',
          }, [
            React.createElement('h3', {
              key: 'tech-title',
              className: "text-lg font-semibold text-cyan-400 mb-3"
            }, "Technologies"),
            React.createElement('div', {
              key: 'tech-list',
              className: "flex flex-wrap gap-2"
            }, projectIdea.technologies.map((tech, index) =>
              React.createElement('span', {
                key: index,
                className: "bg-cyan-600/20 text-cyan-300 px-3 py-1 rounded-full text-sm border border-cyan-600/30"
              }, tech)
            ))
          ]),
          React.createElement('div', {
            key: 'difficulty',
          }, [
            React.createElement('h3', {
              key: 'diff-title',
              className: "text-lg font-semibold text-cyan-400 mb-3"
            }, "Difficulty"),
            React.createElement('span', {
              key: 'diff-badge',
              className: `inline-block px-4 py-2 rounded-full text-sm font-medium ${
                projectIdea.difficulty === 'Beginner' ? 'bg-green-600/20 text-green-300 border border-green-600/30' :
                projectIdea.difficulty === 'Intermediate' ? 'bg-yellow-600/20 text-yellow-300 border border-yellow-600/30' :
                'bg-red-600/20 text-red-300 border border-red-600/30'
              }`
            }, projectIdea.difficulty)
          ])
        ])
      ])
    ])
  ]);
}

// Render the app
ReactDOM.render(React.createElement(ProjectIdeaApp), document.getElementById('root'));
