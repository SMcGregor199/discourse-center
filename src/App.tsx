import { EditorShell } from './components/EditorShell'
import './App.css'

export default function App() {
  return (
    <main className='app'>
      <header className='app-header'>
        <h1>Discourse Center</h1>
        <p>Notion-style rich text editing with local persistence.</p>
      </header>
      <EditorShell />
    </main>
  )
}
