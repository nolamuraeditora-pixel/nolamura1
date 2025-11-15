
import React, { useState, useEffect, useCallback, createContext, lazy, Suspense } from 'react';
import { Video, User, ModalType, Theme, LanguageCode } from './types';
import { MOCK_VIDEOS, TRANSLATIONS } from './constants';
import Sidebar from './components/Sidebar';
import VideoGrid from './components/VideoGrid';

const VideoDetail = lazy(() => import('./components/VideoDetail'));
const AuthModal = lazy(() => import('./components/AuthModal'));

type DeviceView = 'desktop' | 'smartphone';

// Create a context to provide the main scrollable element to nested components
export const ScrollContainerContext = createContext<HTMLElement | null>(null);

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full w-full p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
);


const App: React.FC = () => {
    // State with initialization from localStorage for persistence
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem('isLoggedIn') === 'true');
    const [user, setUser] = useState<User | null>(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || Theme.Dark);
    const [language, setLanguage] = useState<LanguageCode>(() => (localStorage.getItem('language') as LanguageCode) || 'en');
    const [isAutoplayEnabled, setIsAutoplayEnabled] = useState<boolean>(() => localStorage.getItem('isAutoplayEnabled') !== 'false');
    const [deviceView, setDeviceView] = useState<DeviceView>(() => (localStorage.getItem('deviceView') as DeviceView) || 'desktop');
    const [playlist, setPlaylist] = useState<Video[]>(() => {
        try {
            const savedPlaylist = localStorage.getItem('playlist');
            return savedPlaylist ? JSON.parse(savedPlaylist) : [];
        } catch (error) {
            console.error("Failed to parse playlist from localStorage", error);
            return [];
        }
    });

    // UI State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [activeModal, setActiveModal] = useState<ModalType | null>(null);
    
    // Data and Filtering State
    const [videos, setVideos] = useState<Video[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Ref for the main scrollable element
    const [mainScrollNode, setMainScrollNode] = useState<HTMLElement | null>(null);

    // Effects for persisting state to localStorage
    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === Theme.Dark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem('isLoggedIn', String(isLoggedIn));
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [isLoggedIn, user]);

    useEffect(() => {
        localStorage.setItem('isAutoplayEnabled', String(isAutoplayEnabled));
    }, [isAutoplayEnabled]);

    useEffect(() => {
        localStorage.setItem('deviceView', deviceView);
    }, [deviceView]);
    
    useEffect(() => {
        localStorage.setItem('playlist', JSON.stringify(playlist));
    }, [playlist]);

    // Effect for fetching and filtering videos
    useEffect(() => {
        const timer = setTimeout(() => {
            let filteredVideos;

            if (selectedCategory === 'myPlaylist') {
                filteredVideos = playlist;
            } else {
                filteredVideos = MOCK_VIDEOS;
                if (selectedCategory) {
                    filteredVideos = filteredVideos.filter(v => v.category === selectedCategory);
                }
            }

            if (searchQuery) {
                const lowercasedQuery = searchQuery.toLowerCase();
                filteredVideos = filteredVideos.filter(
                    v => v.title.toLowerCase().includes(lowercasedQuery) || 
                         v.description.toLowerCase().includes(lowercasedQuery)
                );
            }
            setVideos(filteredVideos);
        }, 300); // Simulate network delay

        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategory, playlist]);


    const t = useCallback((key: string): string => {
        const keys = key.split('.');
        let result: any = TRANSLATIONS[language];
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                result = undefined;
                break;
            }
        }
        
        if (typeof result === 'string') {
            return result;
        }

        // Fallback to English
        let fallbackResult: any = TRANSLATIONS.en;
        for (const k of keys) {
             if (fallbackResult && typeof fallbackResult === 'object' && k in fallbackResult) {
                fallbackResult = fallbackResult[k];
            } else {
                return key; // Return key if not found in fallback either
            }
        }
        return typeof fallbackResult === 'string' ? fallbackResult : key;
    }, [language]);

    const handleLogin = useCallback((credentials?: { email: string; password: string }) => {
        // In a real app, you would validate credentials against a backend.
        console.log('Login attempt with:', credentials);
        setUser({ name: 'Jane Doe', email: 'jane.doe@example.com', avatarUrl: 'https://picsum.photos/seed/user/100/100' });
        setIsLoggedIn(true);
        setActiveModal(null);
    }, []);

    const handleLogout = useCallback(() => {
        setUser(null);
        setIsLoggedIn(false);
        if (selectedCategory === 'myPlaylist') {
            setSelectedCategory(null);
        }
    }, [selectedCategory]);

    const handleVideoSelect = useCallback((video: Video) => {
        setSelectedVideo(video);
    }, []);

    const handleGoBackToGrid = useCallback(() => {
        setSelectedVideo(null);
    }, []);

    const handleOpenModal = useCallback((modalType: ModalType) => {
        setActiveModal(modalType);
    }, []);
    
    const handleCloseModal = useCallback(() => {
        setActiveModal(null);
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === Theme.Light ? Theme.Dark : Theme.Light);
    }, []);

    const toggleAutoplay = useCallback(() => {
        setIsAutoplayEnabled(prev => !prev);
    }, []);

    const isVideoInPlaylist = useCallback((videoId: number) => {
        return playlist.some(video => video.id === videoId);
    }, [playlist]);

    const togglePlaylist = useCallback((video: Video) => {
        setPlaylist(currentPlaylist => {
            const exists = currentPlaylist.some(v => v.id === video.id);
            if (exists) {
                return currentPlaylist.filter(v => v.id !== video.id);
            } else {
                return [...currentPlaylist, video];
            }
        });
    }, []);

    return (
        <div className={`flex h-screen w-full text-dark-text bg-white dark:bg-dark-bg transition-colors duration-300`}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
                isLoggedIn={isLoggedIn}
                user={user}
                onOpenModal={handleOpenModal}
                onLogout={handleLogout}
                onToggleTheme={toggleTheme}
                currentTheme={theme}
                t={t}
                language={language}
                setLanguage={setLanguage}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                isAutoplayEnabled={isAutoplayEnabled}
                onToggleAutoplay={toggleAutoplay}
                deviceView={deviceView}
                setDeviceView={setDeviceView}
            />
            <main ref={setMainScrollNode} className={`flex-1 transition-all duration-300 overflow-y-auto ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
                <ScrollContainerContext.Provider value={mainScrollNode}>
                    <Suspense fallback={<LoadingSpinner />}>
                        {selectedVideo ? (
                            <VideoDetail 
                                video={selectedVideo} 
                                onGoBack={handleGoBackToGrid} 
                                t={t} 
                                isInPlaylist={isVideoInPlaylist(selectedVideo.id)}
                                onTogglePlaylist={togglePlaylist}
                            />
                        ) : (
                            <div className="p-4 sm:p-6 lg:p-8">
                                <VideoGrid videos={videos} onVideoSelect={handleVideoSelect} isAutoplayEnabled={isAutoplayEnabled} />
                            </div>
                        )}
                    </Suspense>
                </ScrollContainerContext.Provider>
            </main>

            {activeModal && (
                 <Suspense fallback={<div />}>
                     <AuthModal
                        modalType={activeModal}
                        onClose={handleCloseModal}
                        onLogin={handleLogin}
                        onSwitchToSignUp={() => setActiveModal(ModalType.SignUp)}
                        onSwitchToSignIn={() => setActiveModal(ModalType.SignIn)}
                        t={t}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default App;