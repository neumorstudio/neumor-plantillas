"use client";

interface FooterMinimalProps {
  businessName: string;
  phone?: string;
  email?: string;
  address?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
}

export function FooterMinimal({
  businessName,
  phone,
  email,
  address,
  socialLinks,
}: FooterMinimalProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-minimal">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3 className="footer-logo">{businessName}</h3>
            {address && <p className="footer-address">{address}</p>}
          </div>

          <div className="footer-contact">
            {phone && (
              <a href={`tel:${phone}`} className="footer-link">
                {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="footer-link">
                {email}
              </a>
            )}
          </div>

          {socialLinks && (
            <div className="footer-social">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="social-link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="18" cy="6" r="1" fill="currentColor" />
                  </svg>
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="social-link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
              )}
              {socialLinks.whatsapp && (
                <a
                  href={socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="social-link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} {businessName}. Todos los derechos reservados.</p>
          <p className="footer-powered">
            Powered by <a href="https://neumorstudio.com" target="_blank" rel="noopener noreferrer">NeumorStudio</a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .footer-minimal {
          background: var(--ng-surface);
          padding: 3rem 0 1.5rem;
          margin-top: auto;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .footer-logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--ng-text-primary);
          margin: 0;
        }

        .footer-address {
          color: var(--ng-text-secondary);
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        .footer-contact {
          display: flex;
          gap: 2rem;
        }

        .footer-link {
          color: var(--ng-text-secondary);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-link:hover {
          color: var(--ng-accent, #6366f1);
        }

        .footer-social {
          display: flex;
          gap: 1rem;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.05);
          color: var(--ng-text-secondary);
          transition: all 0.2s;
        }

        .social-link:hover {
          background: var(--ng-accent, #6366f1);
          color: white;
        }

        .social-link svg {
          width: 20px;
          height: 20px;
        }

        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1.5rem;
          font-size: 0.875rem;
          color: var(--ng-text-secondary);
        }

        .footer-powered a {
          color: var(--ng-accent, #6366f1);
          text-decoration: none;
        }

        @media (max-width: 768px) {
          .footer-content {
            flex-direction: column;
            text-align: center;
          }

          .footer-contact {
            flex-direction: column;
            gap: 0.5rem;
          }

          .footer-bottom {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
}

export default FooterMinimal;
