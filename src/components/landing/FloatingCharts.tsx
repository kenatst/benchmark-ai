import { BarChart3, PieChart, TrendingUp, Target, Layers, Zap } from 'lucide-react';

export const FloatingCharts = () => {
  const icons = [
    { Icon: BarChart3, top: '15%', left: '5%', delay: '0s', size: 'w-12 h-12', color: 'text-coral/30' },
    { Icon: PieChart, top: '25%', right: '8%', delay: '1s', size: 'w-16 h-16', color: 'text-sky/25' },
    { Icon: TrendingUp, top: '60%', left: '3%', delay: '2s', size: 'w-10 h-10', color: 'text-mint/30' },
    { Icon: Target, top: '70%', right: '5%', delay: '3s', size: 'w-14 h-14', color: 'text-lavender/25' },
    { Icon: Layers, top: '40%', left: '8%', delay: '4s', size: 'w-8 h-8', color: 'text-peach/30' },
    { Icon: Zap, top: '85%', right: '12%', delay: '5s', size: 'w-10 h-10', color: 'text-gold/30' },
    { Icon: BarChart3, bottom: '20%', left: '15%', delay: '1.5s', size: 'w-8 h-8', color: 'text-coral/20' },
    { Icon: PieChart, bottom: '30%', right: '18%', delay: '2.5s', size: 'w-10 h-10', color: 'text-sky/20' },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {icons.map((item, index) => {
        const { Icon, delay, size, color, ...position } = item;
        return (
          <div
            key={index}
            className={`absolute animate-float-slow ${size} ${color}`}
            style={{
              ...position,
              animationDelay: delay,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          >
            <Icon className="w-full h-full" strokeWidth={1.5} />
          </div>
        );
      })}

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lavender/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-coral/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-sky/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />

      {/* Grid pattern overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.02]">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Animated connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(216, 191, 216, 0.2)" />
            <stop offset="50%" stopColor="rgba(135, 206, 235, 0.15)" />
            <stop offset="100%" stopColor="rgba(152, 251, 152, 0.1)" />
          </linearGradient>
        </defs>
        <path
          d="M0,200 Q400,100 800,300 T1600,200"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          className="animate-dash"
          strokeDasharray="10 20"
        />
        <path
          d="M0,400 Q300,500 600,350 T1200,450"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          className="animate-dash"
          strokeDasharray="15 25"
          style={{ animationDelay: '2s' }}
        />
      </svg>
    </div>
  );
};
