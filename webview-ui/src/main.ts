import './app.css'
import App from './App.svelte'
import { injectVscodeTheme } from './theme'

// Inject VS Code color variables into DaisyUI theme before mounting
injectVscodeTheme()

const app = new App({ target: document.getElementById('app')! })

export default app
