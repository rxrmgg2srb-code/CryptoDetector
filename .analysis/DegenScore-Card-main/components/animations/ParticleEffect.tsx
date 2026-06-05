import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ParticleEffectProps {
  trigger: boolean;
  type?: 'confetti' | 'stars' | 'fireworks';
}

export const ParticleEffect = ({ trigger, type = 'confetti' }: ParticleEffectProps) => {
  useEffect(() => {
    if (!trigger) {
      return;
    }

    const effects = {
      confetti: () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      },
      stars: () => {
        confetti({
          particleCount: 50,
          spread: 360,
          startVelocity: 30,
          decay: 0.9,
          scalar: 1.2,
          shapes: ['star'],
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        });
      },
      fireworks: () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 7,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
          });
          confetti({
            particleCount: 7,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
      },
    };

    effects[type]();
  }, [trigger, type]);

  return null;
};
