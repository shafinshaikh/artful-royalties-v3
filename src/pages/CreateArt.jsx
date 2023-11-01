import React, { useState, useEffect } from 'react';
import Loader from '../components/Loader.jsx'; // Adjust this import path if necessary

function CreateArt() {
    const [prompt, setPrompt] = useState('');
    const [tokenBalance, setTokenBalance] = useState(100); // Example initial value
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // New state for loading
    const [selectedArtist, setSelectedArtist] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [artists, setArtists] = useState([]); // State to hold artists data

    // Fetch artists and their styles from MongoDB
    useEffect(() => {
        const fetchArtists = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/get-artists', {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setArtists(data.artists);
                    setSearchResults(data.artists.slice(0, 2)); // Default suggested artists
                } else {
                    console.error("Failed to fetch artists:", data.message);
                }
            } catch (error) {
                console.error("Error fetching artists:", error);
            }
        };

        fetchArtists();
    }, []);

    const handleGenerateArt = async () => {
        setIsLoading(true); // Start loading
        const artistStyle = selectedArtist ? selectedArtist.styleDescription : '';
        const combinedPrompt = `${prompt}. ${artistStyle}`;

        try {
            const response = await fetch('http://localhost:5000/api/generate-art', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ textPrompts: combinedPrompt })
            });

            const data = await response.json();
            if (data.success) {
                setHistory(prev => [...data.images.map(url => ({ imageUrl: url, cost: 10 })), ...prev]);
                setTokenBalance(prev => prev - 10); // Assuming a fixed cost for now
            } else {
                console.error("Art generation failed:", data.message);
            }
        } catch (error) {
            console.error("Art generation error:", error);
        }
        setIsLoading(false); // Stop loading
    };

    const handleArtistSelection = (artist) => {
        setSelectedArtist(artist);
        setSearchTerm(artist.name);
        setSearchResults([]);
    };

    const handleSearch = (term) => {
        if (!term) {
            setSearchResults(artists.slice(0, 2));
        } else {
            const results = artists.filter(artist => artist.name.toLowerCase().includes(term.toLowerCase()));
            setSearchResults(results);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Navbar */}
            <div className="p-3 bg-[#cedada] text-black rounded-md">
                User Token Balance: {tokenBalance}
            </div>
            
            {/* Main Content */}
            <div className="flex-grow flex">
                {/* History Column */}
                <div className="w-1/4 overflow-y-auto">
                    <div>
                        <div className='text-black justify-center align-middle my-5 mx-16 font-bold text-xl'><h2>Your Creations-</h2></div>
                        {history.map((art, index) => (
                            <div key={index} className="p-2 border-b">
                                <img src={art.imageUrl} alt="Generated Art" className="w-full h-32 object-cover" />
                                <div>Cost: {art.cost}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Central Image Display and Prompt */}
                <div className="w-1/2 flex flex-col items-center p-4">
                    {isLoading ? (
                        <div className="flex-grow bg-gray-300 w-full rounded-md h-10 px-20 py-20">
                            <div className="flex-col items-center mx-20 my-20">
                            <Loader/> <br></br><div>Please wait while your creation is blooming...</div>
                            </div>
                        </div>
                    ) : history.length > 0 ? (
                        <img src={history[0].imageUrl} alt="Generated Art" className="flex-grow w-full rounded-md" />
                    ) : (
                        <div className="flex-grow bg-gray-300 w-full rounded-md h-10"></div> // Placeholder
                    )}
                    <div className="flex mt-4 w-full">
                        <input 
                            type="text" 
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)} 
                            className="flex-grow p-2 border rounded-md"
                            placeholder="Enter your prompt..."
                        />
                        <button 
                            onClick={handleGenerateArt} 
                            className="ml-2 bg-blue-500 text-white p-2 rounded-md"
                        >Dream</button>
                    </div>
                </div>

                {/* Artist Column */}
                <div className="w-1/4 p-4">
                    <div className="mb-4">
                        <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                handleSearch(e.target.value);
                            }}
                            onFocus={() => handleSearch('')}
                            placeholder="Search for artists..."
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                    
                    {searchResults.map((artist, index) => (
                        <div key={index} className="mb-4 cursor-pointer" onClick={() => handleArtistSelection(artist)}>
                            <div className="font-bold">{artist.name}</div>
                            <div className="flex overflow-x-auto">
                                {artist.artworks.slice(0, 5).map((artwork, idx) => (
                                    <img key={idx} src={artwork.imageUrl} alt={`Preview of ${artist.name}`} className="w-40 h-40 object-cover rounded-md mr-2" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CreateArt;
