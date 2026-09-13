import { useEffect, useState } from "react";

import Dashboard from "./pages/Dashboard";
import History from "./pages/History";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

function App() {
  const [page, setPage] = useState<"dashboard" | "history">("dashboard");

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isInstalled, setIsInstalled] = useState(false);

  const [showInstallFallback, setShowInstallFallback] = useState(false);

  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    /*
     * Check if the application is already installed.
     */
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(
        (window.navigator as Navigator & {
          standalone?: boolean;
        }).standalone
      );

    setIsInstalled(isStandalone);

    /*
     * Chrome / Edge / Chromium-based browsers
     * fire this event when the PWA can be installed.
     */
    const handleBeforeInstallPrompt = (event: Event) => {
      console.log("🔥 beforeinstallprompt fired");

      // Prevent the browser from showing its default mini-infobar.
      event.preventDefault();

      setInstallPrompt(event as BeforeInstallPromptEvent);

      setShowInstallFallback(false);
    };

    /*
     * Fired after the application has been installed.
     */
    const handleAppInstalled = () => {
      console.log("✅ appinstalled fired");

      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstallFallback(false);
      setIsInstalling(false);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  /*
   * Install PWA
   */
  const handleInstall = async () => {
    if (isInstalling) {
      return;
    }

    setIsInstalling(true);

    if (!installPrompt) {
      console.warn("⚠️ No install prompt available");

      setShowInstallFallback(true);
      window.setTimeout(() => {
        setIsInstalling(false);
      }, 1200);

      return;
    }

    try {
      console.log("🚀 Opening PWA install prompt...");

      await installPrompt.prompt();

      const choice = await installPrompt.userChoice;

      console.log("Install choice:", choice);

      if (choice.outcome === "accepted") {
        console.log("✅ User accepted the installation");

        setInstallPrompt(null);
        setIsInstalled(true);
        setShowInstallFallback(false);
      } else {
        console.log("❌ User dismissed the installation");

        setInstallPrompt(null);
      }
    } catch (error) {
      console.error("❌ PWA installation failed:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const showInstallBanner = !isInstalled;

  return (
    <>
      {/* =====================================================
          PWA INSTALL BANNER
      ====================================================== */}

      {showInstallBanner && (
        <div className="install-banner">
          <span>
            {isInstalling
              ? "Installing..."
              : "Install My Expenses"}
          </span>

          <button
            type="button"
            onClick={() => void handleInstall()}
            disabled={isInstalling}
          >
            {isInstalling ? "Loading..." : "Install app"}
          </button>
        </div>
      )}

      {/* =====================================================
          INSTALL FALLBACK
      ====================================================== */}

      {showInstallFallback && !isInstalled && (
        <div className="install-fallback">
          <p>
            Installation is not available automatically.
          </p>

          <p>
            Use your browser menu and choose{" "}
            <strong>Install app</strong> or{" "}
            <strong>Add to Home screen</strong>.
          </p>
        </div>
      )}

      {/* =====================================================
          PAGES
      ====================================================== */}

      {page === "dashboard" ? <Dashboard /> : <History />}

      {/* =====================================================
          BOTTOM NAVIGATION
      ====================================================== */}

      <nav
        className="bottom-nav"
        aria-label="Main navigation"
      >
        <button
          type="button"
          className={page === "dashboard" ? "active" : ""}
          onClick={() => setPage("dashboard")}
        >
          Home
        </button>

        <button
          type="button"
          className={page === "history" ? "active" : ""}
          onClick={() => setPage("history")}
        >
          History
        </button>
      </nav>
    </>
  );
}

export default App;