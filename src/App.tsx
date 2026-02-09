import { Routes, Route, Link } from 'react-router-dom'

function Home() {
  return <h1>Home</h1>
}

function About() {
  return <h1>About</h1>
}

export default function App() {
  return (
    <div style={{ padding: 16 }}>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Link to='/'>Home</Link>
        <Link to='/about'>About</Link>
      </nav>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/about' element={<About />} />
      </Routes>
    </div>
  )
}
