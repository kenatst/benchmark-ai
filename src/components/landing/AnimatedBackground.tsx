import { useEffect, useRef } from 'react';

export const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      type: 'chart' | 'dot' | 'line' | 'bar';
      color: string;
      rotation: number;
      rotationSpeed: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.size = Math.random() * 30 + 10;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.15 + 0.05;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.01;
        
        const types: ('chart' | 'dot' | 'line' | 'bar')[] = ['chart', 'dot', 'line', 'bar'];
        this.type = types[Math.floor(Math.random() * types.length)];
        
        const colors = [
          'rgba(255, 138, 128, ',  // coral
          'rgba(135, 206, 235, ',  // sky
          'rgba(152, 251, 152, ',  // mint
          'rgba(216, 191, 216, ',  // lavender
          'rgba(255, 218, 185, ',  // peach
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        if (this.x < -50) this.x = canvas!.width + 50;
        if (this.x > canvas!.width + 50) this.x = -50;
        if (this.y < -50) this.y = canvas!.height + 50;
        if (this.y > canvas!.height + 50) this.y = -50;
      }

      draw() {
        if (!ctx) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;

        switch (this.type) {
          case 'chart':
            // Pie chart icon
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 1.5);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fillStyle = this.color + '1)';
            ctx.fill();
            ctx.strokeStyle = this.color + '0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            break;

          case 'bar': {
            // Bar chart icon
            const barWidth = this.size / 5;
            const heights = [0.6, 1, 0.4, 0.8];
            heights.forEach((h, i) => {
              ctx.fillStyle = this.color + '1)';
              ctx.fillRect(
                -this.size / 2 + i * (barWidth + 2),
                this.size / 2 - this.size * h,
                barWidth,
                this.size * h
              );
            });
            break;
          }

          case 'line':
            // Line chart icon
            ctx.beginPath();
            ctx.moveTo(-this.size / 2, this.size / 4);
            ctx.lineTo(-this.size / 4, -this.size / 4);
            ctx.lineTo(0, 0);
            ctx.lineTo(this.size / 4, -this.size / 2);
            ctx.lineTo(this.size / 2, -this.size / 4);
            ctx.strokeStyle = this.color + '1)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            break;

          case 'dot':
            // Data point
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 4, 0, Math.PI * 2);
            ctx.fillStyle = this.color + '1)';
            ctx.fill();
            // Outer ring
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2.5, 0, Math.PI * 2);
            ctx.strokeStyle = this.color + '0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            break;
        }

        ctx.restore();
      }
    }

    const init = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 50000);
      for (let i = 0; i < Math.min(particleCount, 30); i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    resize();
    init();
    animate();

    window.addEventListener('resize', () => {
      resize();
      init();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};
