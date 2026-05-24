/**
 * PageShell — Layout wrapper with Navbar and content area.
 */
import Navbar from './Navbar'

export default function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  )
}
