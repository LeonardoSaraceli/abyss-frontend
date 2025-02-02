import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import logo from '../assets/images/logo.svg'
import { faHouse, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import '../assets/styles/header.css'
import { useContext } from 'react'
import { StateContext } from './App'

export default function Header() {
  const { user, currentVisualizer, setCurrentVisualizer, setSearchBar } =
    useContext(StateContext)

  return (
    <header id="header">
      <a href="/">
        <img loading='lazy' src={logo} alt="Abyss" />
      </a>

      <div id="search-nav">
        <FontAwesomeIcon
          icon={faHouse}
          onClick={() =>
            Object.entries(currentVisualizer).length > 0
              ? [
                  localStorage.removeItem('current-visualizer'),
                  setCurrentVisualizer({}),
                ]
              : null
          }
        />

        <div>
          <FontAwesomeIcon icon={faMagnifyingGlass} />

          <input
            type="search"
            name="search"
            autoComplete="off"
            onChange={(e) => setSearchBar(e.target.value)}
            placeholder="O que você quer ouvir?"
          />
        </div>
      </div>

      {Object.entries(user).length > 0 ? (
        user.picture ? (
          <img loading='lazy' id="profile-has-picture" src={user.picture} alt={user.name} />
        ) : (
          <span id="profile-has-account">{user.name[0].toUpperCase()}</span>
        )
      ) : (
        <div id="account-nav">
          <a href="/register" id="main-register">
            Inscrever-se
          </a>

          <a href="/login" id="main-login">
            Entrar
          </a>
        </div>
      )}
    </header>
  )
}
