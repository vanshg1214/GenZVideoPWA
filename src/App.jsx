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
    setPlayingIntro(false); // Remove video when redirecting
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
        try { localStorage.setItem('pwa-installed', 'true'); } catch(e) {}
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

  let isActuallyInstalled = false;
  try {
    isActuallyInstalled = localStorage.getItem('pwa-installed') === 'true' || isAppInstalled;
  } catch (e) {
    isActuallyInstalled = isAppInstalled;
  }

  useEffect(() => {
    // Check for standalone mode immediately on mount with safety
    let isStandalone = false;
    try {
      isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                     window.navigator.standalone || 
                     (document.referrer && document.referrer.includes('android-app://')) ||
                     new URLSearchParams(window.location.search).get('source') === 'pwa';
    } catch (e) {
      console.error('Detection error:', e);
    }

    if (isStandalone) {
      console.log('Standalone mode detected.');
      try { localStorage.setItem('pwa-installed', 'true'); } catch(e) {}
      
      const hasPlayedThisSession = sessionStorage.getItem('intro-played') === 'true';
      
      if (!hasPlayedThisSession) {
        setCurrentVideo('/icons/pollito_compressed.mp4');
        setPlayingIntro(true);
        sessionStorage.setItem('intro-played', 'true');
      } else {
        handleRedirect();
      }
      
      const fallbackTimer = setTimeout(() => {
        handleRedirect();
      }, 15000);
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [handleRedirect, isAppInstalled]);

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
