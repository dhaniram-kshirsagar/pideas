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
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            setIsMobile(window.innerWidth < 768); // Set mobile breakpoint
        };

        updateCanvasSize();

        let particles = [];

        let textImageData = null;

        function createTextImage() {
            if (!ctx || !canvas) return 0;

            ctx.fillStyle = "white";
            ctx.save();

            // Set up text properties
            const fontSize = isMobile ? 80 : 120;
            ctx.font = `bold ${fontSize}px Arial, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // Draw "Pideas" text
            ctx.fillText("Pideas", canvas.width / 2, canvas.height / 2);

            ctx.restore();

            textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            return 1; // Return a simple scale value
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
                        scatteredColor: "#00DCFF", // Use cyan for all particles
                        isAWS: false,
                        life: Math.random() * 100 + 50,
                    };
                }
            }

            return null;
        }

        function createInitialParticles(scale) {
            const baseParticleCount = 7000; // Increased base count for higher density
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

        const scale = createTextImage();
        createInitialParticles(scale);
        animate(scale);

        const handleResize = () => {
            updateCanvasSize();
            const newScale = createTextImage();
            particles = [];
            createInitialParticles(newScale);
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
