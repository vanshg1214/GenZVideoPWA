import { useState, useEffect, useCallback } from 'react';
import { usePWAInstall } from './hooks/usePWAInstall';
import { InstallBanner } from './components/InstallBanner';
import { IOSInstructions } from './components/IOSInstructions';
import { VideoIntro } from './components/VideoIntro';
import { Download, ArrowRight } from 'lucide-react';
import './index.css';

function App() {
  const { deferredPrompt, isAppInstalled, isIOS, installApp } = usePWAInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [playingIntro, setPlayingIntro] = useState(false);
  const [currentVideo, setCurrentVideo] = useState('');
  const [hasJustInstalled, setHasJustInstalled] = useState(false);
  const targetUrl = 'https://www.vcb.services';

  const handleRedirect = useCallback(() => {
    if (isRedirecting) return;
    setIsRedirecting(true);
    console.log('Redirecting to target URL:', targetUrl);
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 800);
  }, [isRedirecting, targetUrl]);

  const handleInstallAction = async () => {
    console.log('Install action triggered. deferredPrompt:', !!deferredPrompt);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('User choice outcome:', outcome);
      
      if (outcome === 'accepted') {
        console.log('Installation accepted. Playing download video...');
        localStorage.setItem('pwa-installed', 'true');
        setHasJustInstalled(true);
        setCurrentVideo('/icons/download_video_optimized.mp4');
        setPlayingIntro(true);
      }
      setShowInstallBanner(false);
    } else if (isIOS) {
      const contactInfo = document.querySelector('.ios-instruction');
      if (contactInfo) {
        contactInfo.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      handleRedirect();
    }
  };

  useEffect(() => {
    // Check for standalone mode immediately on mount
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone || 
                        document.referrer.includes('android-app://') ||
                        window.location.search.includes('source=pwa');

    console.log('Mount check - isStandalone:', isStandalone);

    if (isStandalone) {
      console.log('Standalone mode detected. Setting intro video...');
      localStorage.setItem('pwa-installed', 'true');
      setCurrentVideo('/icons/pollito_compressed.mp4');
      setPlayingIntro(true);
      
      // Fallback: If for some reason the video doesn't end or show, redirect after a safe timeout
      const fallbackTimer = setTimeout(() => {
        console.log('Fallback redirect triggered after timeout');
        handleRedirect();
      }, 15000); // 15 seconds max for intro
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [handleRedirect]); // Run on mount

  const isActuallyInstalled = localStorage.getItem('pwa-installed') === 'true' || isAppInstalled;

  useEffect(() => {
    if (deferredPrompt && !sessionStorage.getItem('bannerDismissed')) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [deferredPrompt]);

  const dismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('bannerDismissed', 'true');
  };

  return (
    <>
      {playingIntro && currentVideo && (
        <VideoIntro src={currentVideo} onFinish={handleRedirect} />
      )}

      <div className={`loader-wrapper ${isRedirecting ? 'active' : ''}`}>
        <div className="spinner"></div>
      </div>

      <div className="container animate-fade-in">
        <div className="logo-wrapper delay-1">
          <img src="/icons/icon.jpg" alt="Pollito chicken Fingers Logo" className="logo-img" />
        </div>
        
        <h1 className="title delay-2">POLLITO CHICKEN FINGERS</h1>
        <p className="subtitle delay-3">
          {isActuallyInstalled 
            ? "Your app is ready. Open it from your home screen for the best experience."
            : "Access instantly from your home screen for a seamless, fast experience."}
        </p>

        <div className="button-group delay-3">
          {isActuallyInstalled ? (
            <div className="installed-badge">
              <button className="btn btn-primary" style={{ backgroundColor: '#059669', cursor: 'default' }}>
                <Download size={20} />
                App Downloaded
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleInstallAction}>
              <Download size={20} />
              Download App
            </button>
          )}
        </div>

        {isIOS && !isAppInstalled && <IOSInstructions />}
      </div>

      <InstallBanner 
        show={showInstallBanner && !isIOS} 
        onInstall={handleInstallAction} 
        onDismiss={dismissBanner} 
      />
    </>
  );
}

export default App;
