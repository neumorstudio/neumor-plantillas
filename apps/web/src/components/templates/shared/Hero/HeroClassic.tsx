"use client";

import { useEffect, useRef } from "react";

interface HeroClassicProps {
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
}

export function HeroClassic({
  title,
  subtitle,
  ctaText = "Reservar Cita",
  ctaLink = "#appointment",
  backgroundImage,
}: HeroClassicProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const shine = shineRef.current;
    if (!card || !shine) return;

    // Check for reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const maxTilt = 15;
    let isHovering = false;

    const onMouseEnter = () => {
      isHovering = true;
      card.style.transition = "transform 0.1s ease-out";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isHovering) return;

      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      const rotateX = (mouseY / (rect.height / 2)) * -maxTilt;
      const rotateY = (mouseX / (rect.width / 2)) * maxTilt;

      card.style.transform = `
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale3d(1.02, 1.02, 1.02)
      `;

      const shineX = ((e.clientX - rect.left) / rect.width) * 100;
      const shineY = ((e.clientY - rect.top) / rect.height) * 100;
      shine.style.setProperty("--mouse-x", `${shineX}%`);
      shine.style.setProperty("--mouse-y", `${shineY}%`);
    };

    const onMouseLeave = () => {
      isHovering = false;
      card.style.transition = "transform 0.5s ease-out";
      card.style.transform = "rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    };

    card.addEventListener("mouseenter", onMouseEnter);
    card.addEventListener("mousemove", onMouseMove);
    card.addEventListener("mouseleave", onMouseLeave);

    return () => {
      card.removeEventListener("mouseenter", onMouseEnter);
      card.removeEventListener("mousemove", onMouseMove);
      card.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <section className="hero">
      {/* Floating Elements */}
      <div className="floating-elements" aria-hidden="true">
        <div className="floating-element floating-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.5" y2="15.5" />
            <line x1="14" y1="14" x2="20" y2="20" />
            <line x1="8.5" y1="8.5" x2="12" y2="12" />
          </svg>
        </div>
        <div className="floating-element floating-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="floating-element floating-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          </svg>
        </div>
      </div>

      {/* Hero 3D Card */}
      {backgroundImage && (
        <div className="hero-3d-container">
          <div ref={cardRef} className="tilt-card">
            <div className="tilt-card-inner neumor-card">
              <img
                src={backgroundImage}
                alt={title}
                className="hero-image"
              />
              <div ref={shineRef} className="shine-overlay" />
            </div>
            <div className="floating-badge badge-1 neumor-card-sm">
              <span className="badge-icon">★</span>
              <span className="badge-text">4.9</span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Content */}
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title animate-fade-in-up">{title}</h1>
          <p className="hero-subtitle animate-fade-in-up animation-delay-100">
            {subtitle}
          </p>
          <a
            href={ctaLink}
            className="neumor-btn neumor-btn-accent hero-cta animate-fade-in-up animation-delay-200"
          >
            <span>{ctaText}</span>
          </a>
        </div>
      </div>

      <style jsx>{`
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 6rem 0 4rem;
          position: relative;
          overflow: hidden;
        }

        .floating-elements {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .floating-element {
          position: absolute;
          color: var(--ng-accent, #6366f1);
          opacity: 0.15;
          animation: float 6s ease-in-out infinite;
        }

        .floating-element svg {
          width: 100%;
          height: 100%;
        }

        .floating-1 {
          top: 15%;
          left: 8%;
          width: 60px;
          height: 60px;
          animation-delay: 0s;
          animation-duration: 7s;
        }

        .floating-2 {
          top: 25%;
          right: 15%;
          width: 40px;
          height: 40px;
          animation-delay: 1s;
          animation-duration: 5s;
        }

        .floating-3 {
          bottom: 30%;
          left: 12%;
          width: 50px;
          height: 50px;
          animation-delay: 2s;
          animation-duration: 8s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(5deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-20px) rotate(3deg); }
        }

        .hero-3d-container {
          position: absolute;
          top: 50%;
          right: 5%;
          transform: translateY(-50%);
          width: 45%;
          max-width: 520px;
          z-index: 1;
          perspective: 1000px;
        }

        .tilt-card {
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.1s ease-out;
          will-change: transform;
        }

        .tilt-card-inner {
          position: relative;
          padding: 1rem;
          border-radius: 2rem;
          overflow: hidden;
          transform-style: preserve-3d;
        }

        .hero-image {
          width: 100%;
          height: auto;
          border-radius: 1.5rem;
          object-fit: cover;
          aspect-ratio: 4/3;
          display: block;
          transform: translateZ(20px);
        }

        .shine-overlay {
          position: absolute;
          inset: 0;
          border-radius: 1.5rem;
          background: radial-gradient(
            circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(255, 255, 255, 0.3) 0%,
            rgba(255, 255, 255, 0.1) 20%,
            transparent 50%
          );
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
          mix-blend-mode: overlay;
        }

        .tilt-card:hover .shine-overlay {
          opacity: 1;
        }

        .floating-badge {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 0.75rem;
          border-radius: 1rem;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--ng-text-primary);
          transform: translateZ(40px);
          animation: badgeFloat 4s ease-in-out infinite;
        }

        .badge-1 {
          top: -10px;
          right: 20px;
        }

        .badge-icon {
          color: #fbbf24;
        }

        @keyframes badgeFloat {
          0%, 100% { transform: translateZ(40px) translateY(0); }
          50% { transform: translateZ(40px) translateY(-8px); }
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          position: relative;
          z-index: 2;
        }

        .hero-content {
          max-width: 50%;
        }

        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 700;
          margin-bottom: 1rem;
          color: var(--ng-text-primary);
          line-height: 1.1;
        }

        .hero-subtitle {
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: var(--ng-text-secondary);
          margin-bottom: 2rem;
          max-width: 420px;
          line-height: 1.6;
        }

        .hero-cta {
          font-size: 1.1rem;
          padding: 1rem 2rem;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          color: white;
          text-decoration: none;
          background: var(--ng-accent, #6366f1);
          border-radius: 1rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }

        @media (max-width: 968px) {
          .hero {
            flex-direction: column;
            text-align: center;
            padding-top: 8rem;
          }

          .hero-3d-container {
            position: relative;
            top: auto;
            right: auto;
            transform: none;
            width: 90%;
            max-width: 400px;
            margin: 0 auto 2rem;
          }

          .hero-content {
            max-width: 100%;
          }

          .hero-subtitle {
            max-width: 100%;
            margin-left: auto;
            margin-right: auto;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-element,
          .floating-badge {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}

export default HeroClassic;
