// Interactive Pideas Logo Component
const InteractiveLogo = () => {
    const canvasRef = React.useRef(null);
    const mousePositionRef = React.useRef({ x: 0, y: 0 });
    const isTouchingRef = React.useRef(false);
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const updateCanvasSize = () => {
            // Ensure the canvas element is properly sized before setting dimensions
            if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
            } else {
                // Fallback to window dimensions if offset dimensions are not available
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            
            // Maintain aspect ratio for the canvas
            const aspectRatio = 16/9;
            if (canvas.width / canvas.height < aspectRatio) {
                // Width is the limiting factor, adjust height
                canvas.height = canvas.width / aspectRatio;
            } else {
                // Height is the limiting factor, adjust width
                canvas.width = canvas.height * aspectRatio;
            }
            
            setIsMobile(window.innerWidth < 768); // Set mobile breakpoint
        };

        updateCanvasSize();

        let particles = [];

        let textImageData = null;

        function createTextImage() {
            if (!ctx || !canvas) return 0;
            
            // Ensure canvas has valid dimensions before proceeding
            if (canvas.width <= 0 || canvas.height <= 0) {
                console.warn('Canvas has invalid dimensions:', canvas.width, canvas.height);
                return 0;
            }

            ctx.fillStyle = "white";
            ctx.save();

            // Set up text properties - adjust font size based on canvas dimensions
            const canvasArea = canvas.width * canvas.height;
            const baseArea = 1920 * 1080;
            const scaleFactor = Math.sqrt(canvasArea / baseArea);
            const fontSize = isMobile ? Math.floor(80 * scaleFactor) : Math.floor(120 * scaleFactor);
            ctx.font = `bold ${fontSize}px Arial, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Draw "Pideas" text
            ctx.fillText("Pideas", canvas.width / 2, canvas.height / 2);

            ctx.restore();

            try {
                textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return 1; // Return a simple scale value
            } catch (error) {
                console.error('Error creating text image:', error);
                return 0;
            }
        }

        function createParticle(scale) {
            if (!ctx || !canvas || !textImageData || scale === 0) return null;

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
                        scatteredColor: "#00DCFF", // Use cyan for all particles
                        isAWS: false,
                        life: Math.random() * 100 + 50,
                    };
                }
            }

            return null;
        }

        function createInitialParticles(scale) {
            const baseParticleCount = 8000; // Increased base count for higher density
            const canvasArea = canvas.width * canvas.height;
            const baseArea = 1920 * 1080;
            const densityFactor = canvasArea / baseArea;
            const particleCount = Math.floor(baseParticleCount * Math.sqrt(densityFactor));
            for (let i = 0; i < particleCount; i++) {
                const particle = createParticle(scale);
                if (particle) particles.push(particle);
            }
        }

        let animationFrameId;

        function animate(scale) {
            if (!ctx || !canvas || scale === 0) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "transparent";
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

        // Initial setup with a small delay to ensure canvas is ready
        setTimeout(() => {
            updateCanvasSize(); // Ensure canvas is properly sized before creating text
            const scale = createTextImage();
            if (scale > 0) {
                createInitialParticles(scale);
                animate(scale);
            }
        }, 200); // Increased delay for better initialization

        const handleResize = () => {
            updateCanvasSize();
            // Add a small delay to ensure canvas dimensions are updated
            setTimeout(() => {
                const newScale = createTextImage();
                if (newScale > 0) {
                    particles = [];
                    createInitialParticles(newScale);
                }
            }, 100);
        };

        const handleMove = (x, y) => {
            const rect = canvas.getBoundingClientRect();
            mousePositionRef.current = { 
                x: x - rect.left, 
                y: y - rect.top 
            };
        };

        const handleMouseMove = (e) => {
            handleMove(e.clientX, e.clientY);
        };

        const handleTouchMove = (e) => {
            if (e.touches.length > 0) {
                e.preventDefault();
                handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        const handleTouchStart = () => {
            isTouchingRef.current = true;
        };

        const handleTouchEnd = () => {
            isTouchingRef.current = false;
            mousePositionRef.current = { x: 0, y: 0 };
        };

        const handleMouseLeave = () => {
            if (!("ontouchstart" in window)) {
                mousePositionRef.current = { x: 0, y: 0 };
            }
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

    return (
        <canvas
            ref={canvasRef}
            className="interactive-logo-canvas"
            aria-label="Interactive Pideas logo"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                touchAction: 'none',
                zIndex: 1
            }}
        />
    );
};
