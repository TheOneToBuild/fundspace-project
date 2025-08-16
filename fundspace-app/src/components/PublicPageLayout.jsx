// src/components/PublicPageLayout.jsx
import React, { useEffect, useContext } from 'react';
import { LayoutContext } from '../App.jsx';

/**
 * A reusable layout wrapper for public pages that need a custom background.
 * It uses the LayoutContext to set the background color for the main layout and footer.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children - The actual page content to render.
 * @param {string} props.bgColor - The Tailwind CSS background color class to apply (e.g., 'bg-[#F8F3ED]').
 */
export default function PublicPageLayout({ children, bgColor }) {
  const { setPageBgColor } = useContext(LayoutContext);

  useEffect(() => {
    // Set this page's specific background color when the component mounts
    if (bgColor) {
      setPageBgColor(bgColor);
    }
    
    // When the component unmounts, reset the background to the default white
    return () => setPageBgColor('bg-white');
  }, [bgColor, setPageBgColor]);

  // This component doesn't render any of its own HTML, it just wraps
  // the page content and provides the background-setting logic.
  return <>{children}</>;
}