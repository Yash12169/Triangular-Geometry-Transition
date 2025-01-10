document.addEventListener("DOMContentLoaded",()=>{


    gsap.registerPlugin(ScrollTrigger)
    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time)=>{
        lenis.raf(time*1000)

    });
    gsap.ticker.lagSmoothing(0);
    const stickySection = document.querySelectorAll(".sticky")
    const stickyHeight = window.innerHeight*5
    const outlineCanvas = document.querySelector(".outline-layer")
    const fillCanvas = document.querySelector(".fill-layer")
    const outlineCtx = outlineCanvas.getContext("2d")
    const fillCtx = fillCanvas.getContext("2d");


     function setCanvasSize(canvas,ctx) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth*dpr
        canvas.height = window.innerHeight*dpr
        canvas.style.width =`${window.innerWidth}px`
        canvas.style.height = `${window.innerHeight}px`
        ctx.scale(dpr,dpr);
     }

     setCanvasSize(outlineCanvas,outlineCtx)
     setCanvasSize(fillCanvas,fillCtx)


     const triangleSize = 150
     const lineWidth = 1;
     const SCALE_THRESHOLD = 0.01
     const triangleStates = new Map()
     let animationFrameId = null
     let canvasXPositions = 0;


     function drawTriangle(ctx, x, y, fillScale = 0, flipped = false ){
        const halfSize = triangleSize/2
        if(fillScale < SCALE_THRESHOLD){
            ctx.beginPath();
            if(!flipped){
                ctx.moveTo(x, y - halfSize);
                ctx.lineTo(x + halfSize, y+ halfSize);
                ctx.lineTo(x-halfSize, y+halfSize)

            }
            else{
                ctx.moveTo(x,y+halfSize)
                ctx.lineTo(x+halfSize,y-halfSize)
                ctx.lineTo(x-halfSize,y-halfSize)

            }
            ctx.closePath();
            ctx.strokeStyle = "rgba(255,255,255,0.075)";
            ctx.lineWidth = lineWidth;
            ctx.stroke();

        }

        if(fillScale >= SCALE_THRESHOLD){
            ctx.save();
            ctx.translate(x,y)
            ctx.scale(fillScale,fillScale);
            ctx.translate(-x,-y);

            ctx.beginPath();
            if(!flipped){
                ctx.moveTo(x,y-halfSize)
                ctx.lineTo(x+halfSize,y+halfSize)
                ctx.lineTo(x-halfSize,y+halfSize)
            }
            else{
                ctx.moveTo(x,y+halfSize)
                ctx.lineTo(x+halfSize,y-halfSize)
                ctx.lineTo(x-halfSize,y-halfSize)

            }
            ctx.closePath();
            ctx.fillStyle = "#ff6b00";


            ctx.strokeStyle = "#ff6b00"
            ctx.lineWidth =lineWidth
            ctx.stroke();
            ctx.fill();
            ctx.restore();

        }

     }



     

     function drawGrid(scrollProgress = 0) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    
        outlineCtx.clearRect(0, 0, outlineCanvas.width, outlineCanvas.height);
        fillCtx.clearRect(0, 0, fillCanvas.width, fillCanvas.height);
        
        const animationProgress = scrollProgress <= 0.65 ? 0 : (scrollProgress - 0.65) / 0.35;
        let needsUpdate = false;
        const animationSpeed = 0.15;
    
        // Function to check if triangle is in visible area with buffer
        const isVisible = (x, y) => {
            const buffer = triangleSize * 2;
            return x >= -buffer && 
                   x <= outlineCanvas.width + buffer && 
                   y >= -buffer && 
                   y <= outlineCanvas.height + buffer;
        };
    
        triangleStates.forEach((state, key) => {
            const x = state.col * (triangleSize * 0.5) + triangleSize/2 + canvasXPositions;
            const y = state.row * triangleSize + triangleSize/2;
    
            if (isVisible(x, y)) {
                if (state.scale < 1) {
                    const flipped = (state.row + state.col) % 2 !== 0;
                    drawTriangle(outlineCtx, x, y, 0, flipped);
                }
            }
        });
    
        triangleStates.forEach((state, key) => {
            const x = state.col * (triangleSize * 0.5) + triangleSize/2 + canvasXPositions;
            const y = state.row * triangleSize + triangleSize/2;
    
            if (isVisible(x, y)) {
                const shouldBeVisible = state.order <= animationProgress;
                const targetScale = shouldBeVisible ? 1 : 0;
                const newScale = state.scale + (targetScale - state.scale) * animationSpeed;
    
                if (Math.abs(newScale - state.scale) > 0.001) {
                    state.scale = newScale;
                    needsUpdate = true;
                }
    
                if (state.scale >= SCALE_THRESHOLD) {
                    const flipped = (state.row + state.col) % 2 !== 0;
                    drawTriangle(fillCtx, x, y, state.scale, flipped);
                }
            }
        });
    
        if (needsUpdate) {
            animationFrameId = requestAnimationFrame(() => drawGrid(scrollProgress));
        }
    }


    function initializeTriangles() {
        // Add extra columns on both sides
        const extraColumns = 4; // Increased buffer columns
        const cols = Math.ceil(window.innerWidth / (triangleSize * 0.5)) + extraColumns;
        const rows = Math.ceil(window.innerHeight / triangleSize) + 1;
        const totalTriangles = rows * cols;
    
        const positions = [];
        for (let r = 0; r < rows; r++) {
            for (let c = -extraColumns/2; c < cols - extraColumns/2; c++) { // Start grid from negative columns
                positions.push({
                    row: r,
                    col: c,
                    key: `${r}-${c}`
                });
            }
        }
    
        // Randomize positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }
    
        triangleStates.clear();
        positions.forEach((pos, index) => {
            triangleStates.set(pos.key, {
                order: index / totalTriangles,
                scale: 0,
                row: pos.row,
                col: pos.col
            });
        });
    }
    


    initializeTriangles();
    drawGrid();

    window.addEventListener("resize",()=>{
        setCanvasSize(outlineCanvas,outlineCtx)
        setCanvasSize(fillCanvas,fillCtx)
        triangleStates.clear()
        initializeTriangles();
        drawGrid();

    })
         
    ScrollTrigger.create({
        trigger: stickySection[0], // Be specific about which section to trigger
        start: "top top",
        end: `+=${stickyHeight}px`,
        pin: true,
        onUpdate: (self) => {  // Fixed typo from 'ouUpdate' to 'onUpdate'
            canvasXPositions = -self.progress * 200;
            drawGrid(self.progress);
    
            const cards = document.querySelector(".cards");
            // Adjusted the progress calculation and translation distance
            const progress = Math.min(self.progress, 1);
            gsap.set(cards, {
                x: -progress * (cards.offsetWidth - window.innerWidth),  // This ensures full width scroll
            });
        },
        scrub: 1 // Added smooth scrolling effect
    });
})  