// components/SideMenu.tsx
import { useEffect, useRef } from "react";

interface SideMenuProps {
  onClose: () => void;
  children: React.ReactNode;
}

export default function SideMenu({ onClose, children }: SideMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="overlay">
      <div className="menu" ref={menuRef}>
        {children}
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.3);
          display: flex;
          justify-content: flex-start; /* menu slides from left */
          align-items: stretch;
          z-index: 1000;
        }
        .menu {
          width: 250px;
          background: white;
          padding: 20px;
          box-shadow: 2px 0 10px rgba(0,0,0,0.2);
          height: 100%;
          display: flex;
          flex-direction: column;
        }
      `}</style>
    </div>
  );
}
