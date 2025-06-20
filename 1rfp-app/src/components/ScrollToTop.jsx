// src/components/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A component that automatically scrolls the window to the top on every page navigation.
 * It detects changes in the URL's pathname and triggers the scroll.
 * This component does not render any visible UI.
 */
const ScrollToTop = () => {
  // The useLocation hook returns the location object that represents the current URL.
  // We only need the `pathname` part of it.
  const { pathname } = useLocation();

  // The useEffect hook runs after every render, but we've limited it to run
  // only when the `pathname` changes.
  useEffect(() => {
    // This command instantly scrolls the window to the coordinates (0, 0).
    window.scrollTo(0, 0);
  }, [pathname]); // The effect dependency array, this effect will run only when `pathname` changes.

  // This component is purely functional and doesn't render any JSX.
  return null;
};

export default ScrollToTop;
