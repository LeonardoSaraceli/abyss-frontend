/* eslint-disable react-refresh/only-export-components */
import { Route, Routes } from 'react-router-dom'
import RegisterWrapper from './RegisterWrapper'
import Login from './Login'
import MainWrapper from './MainWrapper'
import { createContext, useCallback, useEffect, useRef, useState } from 'react'

export const StateContext = createContext()

export default function App() {
  const [user, setUser] = useState({})
  const [users, setUsers] = useState(
    JSON.parse(localStorage.getItem('users')) || []
  )
  const [usersMusics, setUsersMusics] = useState(
    JSON.parse(localStorage.getItem('usersMusics')) || []
  )
  const [usersAlbums, setUsersAlbums] = useState(
    JSON.parse(localStorage.getItem('usersAlbums')) || []
  )
  const [musics, setMusics] = useState(
    JSON.parse(localStorage.getItem('musics')) || []
  )
  const [albums, setAlbums] = useState(
    JSON.parse(localStorage.getItem('albums')) || []
  )
  const [currentVisualizer, setCurrentVisualizer] = useState(
    JSON.parse(localStorage.getItem('current-visualizer')) || {}
  )
  const [currentMusic, setCurrentMusic] = useState(
    JSON.parse(localStorage.getItem('current-music')) || {}
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(() => {
    return parseFloat(localStorage.getItem('music-volume')) || 0.25
  })
  const [selectedMusic, setSelectedMusic] = useState(false)
  const [musicQueue, setMusicQueue] = useState(
    JSON.parse(localStorage.getItem('music-queue')) || []
  )
  const [currentQueueIndex, setCurrentQueueIndex] = useState(
    JSON.parse(localStorage.getItem('current-queue-index')) || 0
  )
  const [currentAlbum, setCurrentAlbum] = useState(
    JSON.parse(localStorage.getItem('current-album')) || null
  )
  const [singles, setSingles] = useState(
    JSON.parse(localStorage.getItem('singles')) || []
  )
  const [searchBar, setSearchBar] = useState('')

  const audioRef = useRef(null)

  const fetchAPI = async (endpoint, setter) => {
    const hasSingles = endpoint.includes('singles')

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      localStorage.setItem(
        hasSingles ? 'singles' : endpoint,
        JSON.stringify(data[hasSingles ? 'musics' : endpoint])
      )
      setter(data[hasSingles ? 'musics' : endpoint])
    } catch (error) {
      console.error(error)
    }
  }

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play()
        setIsPlaying(true)
      } else {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  const volumeBarRef = useRef(null)

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    localStorage.setItem('music-volume', newVolume)

    const ratio = newVolume * 100

    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }

    if (volumeBarRef.current) {
      volumeBarRef.current.style.background = `linear-gradient(90deg, #ffffff ${ratio}%, #292929 ${ratio}%)`
    }
  }

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''

      if (currentMusic && (currentMusic.url || currentMusic.music_url)) {
        audioRef.current.src = currentMusic.url || currentMusic.music_url
        audioRef.current.load()
        setIsPlaying(false)
      }
    }
  }, [currentMusic])

  useEffect(() => {
    if (!isPlaying && selectedMusic) {
      setSelectedMusic(false)
      togglePlayPause()
    }
  }, [isPlaying, selectedMusic])

  const fetchUserInfo = () => {
    if (localStorage.getItem('jwt')) {
      fetch(`${import.meta.env.VITE_API_URL}/users/info`, {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            return
          }

          return res.json()
        })
        .then((data) => {
          if (data) {
            setUser(data.user)
          }
        })
        .catch((error) => console.error(error))
    }
  }

  useEffect(() => {
    fetchUserInfo()
    fetchAPI('musics/singles', setSingles)
    fetchAPI('users', setUsers)
    fetchAPI('usersMusics', setUsersMusics)
    fetchAPI('usersAlbums', setUsersAlbums)
    fetchAPI('musics', setMusics)
    fetchAPI('albums', setAlbums)
  }, [])

  const truncateWord = (word, limit) => {
    return word.length > limit
      ? word
          .split('')
          .slice(0, limit - 3)
          .join('')
          .trim() + '...'
      : word
  }

  const getCreatorNames = useCallback(
    (id) => {
      const relatedUsers = [...usersMusics, ...usersAlbums]
        .filter(
          (relation) => relation.musicid === id || relation.albumid === id
        )
        .map((relation) => relation.userid)

      return users
        .filter((user) => relatedUsers.includes(user.id))
        .map((user) => user.name)
        .join(', ')
    },
    [users, usersAlbums, usersMusics]
  )

  useEffect(() => {
    localStorage.setItem('music-queue', JSON.stringify(musicQueue))
  }, [musicQueue])

  useEffect(() => {
    if (audioRef.current && isPlaying && audioRef.current.volume !== volume) {
      audioRef.current.volume = volume
    }
  }, [volume, isPlaying])

  useEffect(() => {
    localStorage.setItem(
      'current-queue-index',
      JSON.stringify(currentQueueIndex)
    )
  }, [currentQueueIndex])

  useEffect(() => {
    const storedQueue = JSON.parse(localStorage.getItem('music-queue'))
    const storedIndex = JSON.parse(localStorage.getItem('current-queue-index'))

    if (storedQueue && storedIndex !== null) {
      setMusicQueue(storedQueue)
      setCurrentQueueIndex(storedIndex)

      if (!currentMusic) {
        setCurrentMusic(storedQueue[storedIndex])
      }
    }
  }, [currentMusic])

  useEffect(() => {
    if ('mediaSession' in navigator && currentMusic) {
      const metadata = {
        title: currentMusic.title || currentMusic.music_title,
        artist: getCreatorNames(currentMusic.id || currentMusic.music_id),
        album: currentAlbum?.title || undefined,
        artwork:
          currentMusic?.cover || currentMusic?.music_cover
            ? [
                {
                  src: currentMusic?.cover || currentMusic?.music_cover,
                },
              ]
            : undefined,
      }

      navigator.mediaSession.metadata = new MediaMetadata(metadata)
    }
  }, [currentAlbum, currentMusic, getCreatorNames])

  return (
    <StateContext.Provider
      value={{
        user,
        users,
        musics,
        albums,
        currentVisualizer,
        setCurrentVisualizer,
        getCreatorNames,
        currentMusic,
        setCurrentMusic,
        isPlaying,
        setIsPlaying,
        audioRef,
        togglePlayPause,
        handleVolumeChange,
        volume,
        setSelectedMusic,
        musicQueue,
        setMusicQueue,
        currentQueueIndex,
        setCurrentQueueIndex,
        currentAlbum,
        setCurrentAlbum,
        setVolume,
        volumeBarRef,
        searchBar,
        setSearchBar,
        truncateWord,
        fetchUserInfo,
        singles,
      }}
    >
      <Routes>
        <Route path="/" element={<MainWrapper />}></Route>

        <Route path="/register" element={<RegisterWrapper />}></Route>

        <Route path="/login" element={<Login />}></Route>
      </Routes>
    </StateContext.Provider>
  )
}
