import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BellRing,
  BookOpen,
  Check,
  ClipboardCheck,
  ChevronDown,
  CircleHelp,
  Facebook,
  FilePlus2,
  HeartHandshake,
  Instagram,
  LayoutDashboard,
  Laptop,
  Library,
  Linkedin,
  LogOut,
  MapPin,
  MessageCircle,
  Menu,
  PackageOpen,
  PackageSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  UserCircle,
  X,
} from 'lucide-react'

const foundItems = [
  {
    name: 'AirPods Pro',
    category: 'Electronics',
    location: 'Central Library',
    date: '2 days ago',
    image:
      'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=700&q=85',
    color: 'lavender',
  },
  {
    name: 'Canvas Backpack',
    category: 'Bags',
    location: 'Student Centre',
    date: '4 days ago',
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=85',
    color: 'mint',
  },
  {
    name: 'Silver Watch',
    category: 'Accessories',
    location: 'Science Block',
    date: '1 week ago',
    image:
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=700&q=85',
    color: 'peach',
  },
  {
    name: 'Student ID Card',
    category: 'Documents',
    location: 'Engineering Block',
    date: '1 week ago',
    image:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=700&q=85',
    color: 'lavender',
  },
  {
    name: 'Blue Notebook',
    category: 'Books',
    location: 'Cafeteria',
    date: '2 weeks ago',
    image:
      'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=700&q=85',
    color: 'mint',
  },
]

const stats = [
  { value: '2,480+', label: 'Items reunited', icon: HeartHandshake },
  { value: '8,900+', label: 'Campus members', icon: Users },
  { value: '96%', label: 'Match accuracy', icon: Target },
]

const apiFetch = (path, token, options = {}) => fetch(`${import.meta.env.VITE_API_BASE_URL || ''}${path}`, {
  ...options,
  headers: {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  },
})

const normalizeItem = (item) => ({
  ...item,
  image: item.image || item.imageData || '',
  type: String(item.type || '').toLowerCase(),
  status: String(item.status || 'PUBLISHED').toLowerCase(),
})

function getLocalPublicItems() {
  const items = []
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key?.startsWith('findora-items-')) continue
    try {
      const reports = JSON.parse(localStorage.getItem(key) || '[]')
      if (Array.isArray(reports)) items.push(...reports)
    } catch {
      // Ignore malformed offline data while preserving valid reports.
    }
    const submitItemResponse = async (event) => {
      event.preventDefault()
      if (!backendAuth || !responseItem) return
      const formData = new FormData(event.currentTarget)
      try {
        const response = await apiFetch(`/api/items/${responseItem.id}/responses`, user.token, {
          method: 'POST',
          body: JSON.stringify({ message: formData.get('message') }),
        })
        if (!response.ok) throw new Error('Unable to send the sighting message')
        setResponseItem(null)
        setSelectedItem(null)
        setApiError('Your sighting message was sent securely to the lost-item owner.')
        window.setTimeout(() => setApiError(''), 3500)
      } catch (error) {
        setApiError(error.message)
      }
    }
  }
  const storedPublicItems = JSON.parse(localStorage.getItem('findora-public-items') || '[]')
  const merged = [...storedPublicItems, ...items]
  return merged.filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
}

function findLocalItemOwner(itemId) {
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key?.startsWith('findora-items-')) continue
    try {
      const reports = JSON.parse(localStorage.getItem(key) || '[]')
      if (reports.some((item) => String(item.id) === String(itemId))) return key.replace('findora-items-', '')
    } catch {
      // Ignore malformed offline data.
    }
  }
  return ''
}

function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem('findora-auth') || 'null')
  } catch {
    return null
  }
}

function AuthPage({ mode, onModeChange, onSubmit, onBack, error }) {
  const isLogin = mode === 'login'
  return (
    <div className="auth-page">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />
      <div className="auth-layout">
        <div className="auth-intro">
          <a className="brand" href="#home" onClick={onBack}>
            <span className="brand-mark"><PackageSearch size={20} strokeWidth={2.5} /></span>
            <span>findora</span>
          </a>
          <div className="auth-intro-copy">
            <div className="eyebrow"><Sparkles size={15} /> Campus reunions, made simple</div>
            <h1>{isLogin ? <>Welcome<br /><em>back.</em></> : <>Make every<br /><em>reunion count.</em></>}</h1>
            <p>{isLogin ? 'Sign in to track your reports, review possible matches and connect securely.' : 'Join your campus community and help lost belongings find their way home.'}</p>
          </div>
          <div className="auth-benefits"><span><ShieldCheck size={16} /> Private by design</span><span><HeartHandshake size={16} /> Built for reunions</span></div>
        </div>
        <div className="auth-card">
          <button className="auth-back" type="button" onClick={onBack}>← Back to home</button>
          <div className="eyebrow">Account access</div>
          <h2>{isLogin ? 'Sign in to Findora' : 'Create your account'}</h2>
          <p className="auth-card-copy">{isLogin ? 'Use your university account to continue.' : 'Start finding what matters to you.'}</p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={onSubmit}>
            {!isLogin && <label>Full name<input required name="name" autoComplete="name" placeholder="Your full name" /></label>}
            <label>University email<input required name="email" type="email" autoComplete="email" placeholder="you@university.edu" /></label>
            <label>Password<input required name="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="At least 8 characters" minLength="8" /></label>
            {isLogin && <button className="forgot-link" type="button">Forgot password?</button>}
            <button className="button button-primary auth-submit" type="submit">{isLogin ? 'Sign in securely' : 'Create my account'} <ArrowRight size={17} /></button>
          </form>
          <div className="auth-switch">{isLogin ? 'New to Findora?' : 'Already have an account?'} <button type="button" onClick={() => onModeChange(isLogin ? 'signup' : 'login')}>{isLogin ? 'Create an account' : 'Sign in'}</button></div>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ user, onLogout }) {
  const storageKey = `findora-items-${user.email}`
  const publicStorageKey = 'findora-public-items'
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem(storageKey) || '[]'))
  const [reportType, setReportType] = useState(null)
  const [activeView, setActiveView] = useState('dashboard')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(() => {
    const localIncoming = JSON.parse(localStorage.getItem(`findora-incoming-claims-${user.email}`) || '[]')
    return localIncoming.length || (items.length ? 1 : 0)
  })
  const [globalItems, setGlobalItems] = useState(getLocalPublicItems)
  const [apiError, setApiError] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [claimItem, setClaimItem] = useState(null)
  const [responseItem, setResponseItem] = useState(null)
  const [incomingClaims, setIncomingClaims] = useState(() => JSON.parse(localStorage.getItem(`findora-incoming-claims-${user.email}`) || '[]'))
  const [itemResponses, setItemResponses] = useState([])
  const [myClaims, setMyClaims] = useState(() => JSON.parse(localStorage.getItem(`findora-claims-${user.email}`) || '[]'))
  const [matches, setMatches] = useState([])
  const [notifications, setNotifications] = useState([])
  const [browseQuery, setBrowseQuery] = useState('')
  const [browseType, setBrowseType] = useState('all')
  const backendAuth = Boolean(user.token && !user.token.startsWith('findora-local-'))

  useEffect(() => {
    if (!backendAuth) return
    const loadSharedData = async () => {
      try {
        const [allResponse, ownResponse, incomingResponse, myClaimsResponse, matchesResponse, notificationsResponse, itemResponsesResponse] = await Promise.all([
          apiFetch('/api/items', user.token),
          apiFetch('/api/items/mine', user.token),
          apiFetch('/api/claims/incoming', user.token),
          apiFetch('/api/claims/mine', user.token),
          apiFetch('/api/matches/mine', user.token),
          apiFetch('/api/notifications/mine', user.token),
          apiFetch('/api/responses/mine', user.token),
        ])
        if (!allResponse.ok || !ownResponse.ok || !incomingResponse.ok || !myClaimsResponse.ok || !matchesResponse.ok || !notificationsResponse.ok || !itemResponsesResponse.ok) throw new Error('Unable to load shared items')
        setGlobalItems((await allResponse.json()).map(normalizeItem))
        const ownItems = (await ownResponse.json()).map(normalizeItem)
        setItems(ownItems)
        localStorage.setItem(storageKey, JSON.stringify(ownItems))
        const incoming = await incomingResponse.json()
        setIncomingClaims(incoming)
        setMyClaims(await myClaimsResponse.json())
        setMatches(await matchesResponse.json())
        const notificationData = await notificationsResponse.json()
        setNotifications(notificationData.notifications || [])
        setUnreadCount(notificationData.unreadCount || 0)
        setItemResponses(await itemResponsesResponse.json())
      } catch {
        setApiError('Shared listings are temporarily unavailable. Start the backend service to load database records.')
      }
    }
    loadSharedData()
  }, [backendAuth, storageKey, user.token])

  const saveItem = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const imageFile = formData.get('image')
    const image = imageFile instanceof File && imageFile.size
      ? await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Unable to read item image'))
        reader.readAsDataURL(imageFile)
      })
      : ''
    const item = {
      id: `${Date.now()}`,
      type: reportType,
      name: String(formData.get('name')).trim(),
      category: String(formData.get('category')),
      location: String(formData.get('location')).trim(),
      date: String(formData.get('date')),
      details: String(formData.get('details')).trim(),
      image,
      ownerEmail: user.email,
    }
    if (backendAuth) {
      try {
        const response = await apiFetch('/api/items', user.token, {
          method: 'POST',
          body: JSON.stringify({ ...item, type: item.type.toUpperCase(), date: item.date, imageData: item.image }),
        })
        if (!response.ok) throw new Error('Unable to save item')
        const savedItem = normalizeItem(await response.json())
        setItems((current) => [savedItem, ...current])
        setGlobalItems((current) => [savedItem, ...current])
        setUnreadCount(1)
        setReportType(null)
      } catch {
        setApiError('This report could not be saved to the shared database. Please check the backend service.')
      }
      return
    }
    const nextItems = [item, ...items]
    setItems(nextItems)
    localStorage.setItem(storageKey, JSON.stringify(nextItems))
    const publicItems = JSON.parse(localStorage.getItem(publicStorageKey) || '[]')
    const nextPublicItems = [{ ...item, status: 'published' }, ...publicItems.filter((existing) => existing.id !== item.id)]
    localStorage.setItem(publicStorageKey, JSON.stringify(nextPublicItems))
    setGlobalItems(nextPublicItems)
    setUnreadCount(1)
    setReportType(null)
  }
  const submitClaim = async (event) => {
    event.preventDefault()
    if (!claimItem) return
    const formData = new FormData(event.currentTarget)
    if (!backendAuth) {
      const localClaim = {
        id: `local-claim-${Date.now()}`,
        itemId: claimItem.id,
        itemName: claimItem.name,
        status: 'PENDING',
        reason: String(formData.get('reason')),
        identifyingInformation: String(formData.get('identifyingInformation')),
        proofOfOwnership: String(formData.get('proofOfOwnership') || ''),
        createdAt: new Date().toISOString(),
      }
      const nextClaims = [localClaim, ...myClaims]
      setMyClaims(nextClaims)
      localStorage.setItem(`findora-claims-${user.email}`, JSON.stringify(nextClaims))
      const ownerEmail = claimItem.ownerEmail || findLocalItemOwner(claimItem.id)
      if (ownerEmail && ownerEmail !== user.email) {
        const incomingKey = `findora-incoming-claims-${ownerEmail}`
        const incomingClaimsForOwner = JSON.parse(localStorage.getItem(incomingKey) || '[]')
        localStorage.setItem(incomingKey, JSON.stringify([{ ...localClaim, claimantName: user.name }, ...incomingClaimsForOwner]))
      }
      setClaimItem(null)
      setSelectedItem(null)
      setApiError('Your claim was saved in this browser. Start the backend for finder verification and cross-device access.')
      window.setTimeout(() => setApiError(''), 4500)
      return
    }
    try {
      const response = await apiFetch(`/api/items/${claimItem.id}/claims`, user.token, {
        method: 'POST',
        body: JSON.stringify({
          reason: formData.get('reason'),
          identifyingInformation: formData.get('identifyingInformation'),
          proofOfOwnership: formData.get('proofOfOwnership'),
        }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.message || 'Unable to submit claim')
      }
      const updateClaim = async (claimId, status) => {
        if (!backendAuth) return
        try {
          const response = await apiFetch(`/api/claims/${claimId}/status`, user.token, {
            method: 'PUT',
            body: JSON.stringify({ status }),
          })
          if (!response.ok) throw new Error('Unable to update claim')
          const updated = await response.json()
          setIncomingClaims((current) => current.map((claim) => claim.id === claimId ? updated : claim))
        } catch (error) {
          setApiError(error.message)
        }
      }
      setClaimItem(null)
      setSelectedItem(null)
      setUnreadCount(1)
    } catch (error) {
      setApiError(error.message)
    }
  }
  const markNotificationsRead = async () => {
    if (backendAuth) await apiFetch('/api/notifications/read', user.token, { method: 'POST' })
    setUnreadCount(0)
  }
  const navigate = (view) => {
    setActiveView(view)
    setNotificationsOpen(false)
    setMobileNavOpen(false)
    if (view === 'report-lost' || view === 'report-found') setReportType(view === 'report-lost' ? 'lost' : 'found')
  }
  const lostItems = items.filter((item) => item.type === 'lost')
  const foundItemsForUser = items.filter((item) => item.type === 'found')
  const insightItems = globalItems.length ? globalItems : items
  const countBy = (field) => Object.entries(insightItems.reduce((counts, item) => {
    const value = item[field] || 'Unknown'
    counts[value] = (counts[value] || 0) + 1
    return counts
  }, {})).sort((first, second) => second[1] - first[1])[0]
  const topLocation = countBy('location')
  const topCategory = countBy('category')
  const insightLostCount = insightItems.filter((item) => item.type === 'lost').length
  const insightFoundCount = insightItems.filter((item) => item.type === 'found').length
  const sidebarGroups = [
    { label: 'Workspace', links: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }, { id: 'browse', label: 'Browse Items', icon: Search }, { id: 'report-lost', label: 'Report Lost Item', icon: FilePlus2 }, { id: 'report-found', label: 'Report Found Item', icon: PackageOpen }, { id: 'my-items', label: 'My Items', icon: ClipboardCheck }] },
    { label: 'Connect', links: [{ id: 'matches', label: 'Smart Matches', icon: Sparkles }, { id: 'claims', label: 'My Claims', icon: ShieldCheck }, { id: 'messages', label: 'Messages', icon: MessageCircle }] },
    { label: 'Account', links: [{ id: 'notifications', label: 'Notifications', icon: BellRing }, { id: 'profile', label: 'My Profile', icon: UserCircle }] },
  ]
  const pageTitle = { browse: 'Browse items', 'my-items': 'My items', matches: 'Smart matches', claims: 'My claims', messages: 'Messages', notifications: 'Notifications', profile: 'My profile' }[activeView]
  const visibleBrowseItems = backendAuth
    ? globalItems
    : [...globalItems.map(normalizeItem), ...foundItems.map((item, index) => normalizeItem({ ...item, id: `sample-${index}`, type: 'found', status: 'published' }))]
  const filteredBrowseItems = visibleBrowseItems.filter((item) => {
    const query = browseQuery.trim().toLowerCase()
    return (!query || `${item.name} ${item.category} ${item.location}`.toLowerCase().includes(query))
      && (browseType === 'all' || item.type === browseType)
  })
  const renderReportedItem = (item) => (
    <div className="dashboard-item" key={item.id}>
      <div className="item-thumb">{item.image ? <img src={item.image} alt="" /> : <PackageSearch size={20} />}</div>
      <span className={`dashboard-item-badge ${item.type}`}>{item.type}</span>
      <div><strong>{item.name}</strong><span>{item.category} · <MapPin size={11} /> {item.location}</span></div>
      <small>{item.date}</small>
      <span className="item-status-label">{item.status || 'Active'}</span>
    </div>
  )
  return (
    <div className="dashboard-page">
      <aside className={`dashboard-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <a className="brand dashboard-brand" href="#dashboard" onClick={() => navigate('dashboard')}><span className="brand-mark"><PackageSearch size={20} strokeWidth={2.5} /></span><span>findora</span></a>
        <div className="sidebar-nav">{sidebarGroups.map((group) => <div className="sidebar-group" key={group.label}><span className="sidebar-label">{group.label}</span>{group.links.map(({ id, label, icon: Icon }) => <button className={`sidebar-link ${activeView === id ? 'active' : ''}`} type="button" key={id} onClick={() => navigate(id)}><Icon size={17} /><span>{label}</span>{id === 'notifications' && unreadCount > 0 && <b>{unreadCount}</b>}</button>)}</div>)}</div>
        <div className="sidebar-bottom"><button className="sidebar-link" type="button" onClick={onLogout}><LogOut size={17} /><span>Log out</span></button></div>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-topbar"><button className="mobile-sidebar-button" type="button" aria-label="Open dashboard menu" onClick={() => setMobileNavOpen((open) => !open)}><Menu size={21} /></button><div className="dashboard-breadcrumb">Workspace <ChevronDown size={14} /></div><div className="dashboard-top-actions"><button className={`notification-button ${unreadCount ? 'has-unread' : ''}`} type="button" aria-label="Notifications" onClick={() => { setNotificationsOpen((open) => !open); markNotificationsRead() }}><BellRing size={19} />{unreadCount > 0 && <span>{unreadCount}</span>}</button><div className="dashboard-user"><span className="user-avatar">{user.name?.slice(0, 1).toUpperCase()}</span><span>{user.name}</span></div><button className="button button-small button-dark top-logout" type="button" onClick={onLogout}>Log out</button></div>{notificationsOpen && <div className="notification-popover"><strong>Notifications</strong>{notifications.length ? notifications.slice(0, 5).map((notification) => <p key={notification.id}>{notification.message}</p>) : <p>{items.length ? 'Your latest report is saved and ready to track.' : 'You have no new notifications.'}</p>}</div>}</header>
        <main className="dashboard-content">
          {activeView === 'dashboard' ? <><div className="dashboard-welcome"><div><div className="eyebrow"><Sparkles size={15} /> Your Findora space</div><h1>Good to see you,<br /><em>{user.name?.split(' ')[0]}.</em></h1><p>Keep track of your items and discover new possible matches.</p></div><button className="button button-primary" type="button" onClick={() => setReportType('lost')}>Report an item <ArrowRight size={17} /></button></div>
            <div className="dashboard-stats"><button type="button" onClick={() => navigate('my-items')}><FilePlus2 /><strong>{lostItems.length}</strong><span>My Lost Items</span><small>View reports <ArrowRight size={13} /></small></button><button type="button" onClick={() => navigate('my-items')}><PackageOpen /><strong>{foundItemsForUser.length}</strong><span>My Found Items</span><small>View reports <ArrowRight size={13} /></small></button><button type="button" onClick={() => navigate('matches')}><Sparkles /><strong>{matches.length}</strong><span>Possible Matches</span><small>Explore matches <ArrowRight size={13} /></small></button><button type="button" onClick={() => navigate('claims')}><ShieldCheck /><strong>{myClaims.filter((claim) => claim.status !== 'REJECTED' && claim.status !== 'RETURNED').length}</strong><span>Active Claims</span><small>View claims <ArrowRight size={13} /></small></button></div>
            <section className="dashboard-panel campus-insights"><div className="section-heading"><div><div className="eyebrow">Campus insights</div><h2>See what is happening nearby.</h2></div><Target size={20} color="#989daf" /></div><div className="insight-grid"><div><strong>{insightLostCount}</strong><span>Lost reports</span></div><div><strong>{insightFoundCount}</strong><span>Found reports</span></div><div><strong>{topLocation ? topLocation[0] : 'No data yet'}</strong><span>Most reported location</span></div><div><strong>{topCategory ? topCategory[0] : 'No data yet'}</strong><span>Most reported category</span></div></div></section>
            <div className="dashboard-columns"><section className="dashboard-panel dashboard-activity"><div className="section-heading"><div><div className="eyebrow">Recent activity</div><h2>Latest updates.</h2></div><CircleHelp size={20} color="#989daf" /></div>{items.length ? <div className="activity-list">{items.slice(0, 4).map((item) => <div className="activity-row" key={`activity-${item.id}`}><span className={`activity-icon ${item.type}`}><Check size={15} /></span><div><strong>{item.type === 'lost' ? 'Lost item reported' : 'Found item reported'}</strong><p>{item.name} was added to your items.</p></div><small>{item.date}</small></div>)}</div> : <p className="empty-copy">Your recent reports and updates will appear here.</p>}</section><section className="dashboard-panel quick-actions"><div className="eyebrow">Quick actions</div><h3>What would you like to do?</h3><button type="button" onClick={() => setReportType('lost')}><FilePlus2 /> Report Lost Item <ArrowRight size={14} /></button><button type="button" onClick={() => setReportType('found')}><PackageOpen /> Report Found Item <ArrowRight size={14} /></button><button type="button" onClick={() => navigate('browse')}><Search /> Browse Items <ArrowRight size={14} /></button></section></div>
            <section className="dashboard-panel reported-panel"><div className="section-heading"><div><div className="eyebrow">Your inventory</div><h2>{items.length ? 'Reported items.' : 'Nothing here yet.'}</h2></div><button className="text-link link-button" type="button" onClick={() => navigate('my-items')}>View all <ArrowRight size={16} /></button></div>{items.length ? <div className="dashboard-items">{items.slice(0, 4).map(renderReportedItem)}</div> : <><p className="empty-copy">When you report a lost or found item, it will appear here with its status and details.</p><button className="button button-dark" type="button" onClick={() => setReportType('lost')}>Report a lost item <ArrowRight size={17} /></button></>}</section>
          </> : <section className="dashboard-panel page-panel"><div className="eyebrow">Findora workspace</div><h1>{pageTitle}</h1><p className="page-description">{activeView === 'browse' ? (backendAuth ? 'Browse published listings from every registered user.' : 'Offline demo reports are visible to every account in this browser. Start the backend for shared database access across devices.') : 'This area is ready for your next Findora action.'}</p>{apiError && <div className="error-message">{apiError}</div>}{activeView === 'matches' && <div className="dashboard-items">{matches.length ? matches.map((match) => <div className="dashboard-item" key={match.id}><span className="dashboard-item-badge pending">{match.score}% match</span><div><strong>{match.lostItem.name} ↔ {match.foundItem.name}</strong><span>{match.lostItem.location} · {match.signals}</span></div><button className="text-link link-button" type="button" onClick={() => setSelectedItem(normalizeItem(match.foundItem))}>View details</button></div>) : <p className="empty-copy">No possible matches have been found yet.</p>}</div>}{activeView === 'my-items' && (items.length ? <div className="dashboard-items">{items.map(renderReportedItem)}</div> : <p className="empty-copy">You have not reported any items yet.</p>)}{activeView === 'claims' && <><div className="dashboard-items">{myClaims.length ? myClaims.map((claim) => <div className="dashboard-item" key={claim.id}><span className="dashboard-item-badge pending">{claim.status === 'UNDER_VERIFICATION' ? 'ON HOLD' : claim.status}</span><div><strong>{claim.itemName}</strong><span>Claim submitted securely</span></div><small>{new Date(claim.createdAt).toLocaleDateString()}</small></div>) : <p className="empty-copy">You have not submitted any claims.</p>}</div>{incomingClaims.length > 0 && <><div className="eyebrow claim-section-label">Incoming claims</div><div className="dashboard-items">{incomingClaims.map((claim) => <div className="dashboard-item" key={`incoming-${claim.id}`}><span className="dashboard-item-badge pending">{claim.status === 'UNDER_VERIFICATION' ? 'ON HOLD' : claim.status}</span><div><strong>{claim.itemName}</strong><span>{claim.identifyingInformation || 'Private ownership details submitted'}</span></div>{claim.status === 'PENDING' && <span className="form-actions"><button className="button button-small button-quiet" type="button" onClick={() => updateClaim(claim.id, 'UNDER_VERIFICATION')}>Hold</button><button className="button button-small button-primary" type="button" onClick={() => updateClaim(claim.id, 'APPROVED')}>Accept</button><button className="button button-small button-quiet" type="button" onClick={() => updateClaim(claim.id, 'REJECTED')}>Reject</button></span>}</div>)}</div></>}</>          }{activeView === 'notifications' && <div className="activity-list">{notifications.map((notification) => <div className="activity-row" key={`notification-${notification.id}`}><span className="activity-icon found"><BellRing size={15} /></span><div><strong>{notification.message}</strong><p>Open Smart Matches to review the details.</p></div><small>{new Date(notification.createdAt).toLocaleDateString()}</small></div>)}{incomingClaims.map((claim) => <div className="activity-row" key={`incoming-notification-${claim.id}`}><span className="activity-icon found"><ShieldCheck size={15} /></span><div><strong>New claim for {claim.itemName}</strong><p>A user submitted an ownership claim for your found item.</p></div><small>{new Date(claim.createdAt).toLocaleDateString()}</small></div>)}{itemResponses.map((response) => <div className="activity-row" key={`response-${response.id}`}><span className="activity-icon lost"><MessageCircle size={15} /></span><div><strong>New sighting for {response.itemName}</strong><p>{response.senderName}: {response.message}</p></div><small>{new Date(response.createdAt).toLocaleDateString()}</small></div>)}{!notifications.length && !itemResponses.length && <p className="empty-copy">No notifications or sighting messages yet.</p>}</div>}{activeView === 'browse' && <><div className="browse-toolbar"><div className="browse-search"><Search size={16} /><input value={browseQuery} onChange={(event) => setBrowseQuery(event.target.value)} placeholder="Search name, category or location" /></div><select value={browseType} onChange={(event) => setBrowseType(event.target.value)}><option value="all">All items</option><option value="lost">Lost items</option><option value="found">Found items</option></select></div><div className="item-grid dashboard-browse-grid">{filteredBrowseItems.map((item) => <article className="item-card browse-card" key={item.id} onClick={() => setSelectedItem(item)}><div className="item-image lavender">{item.image ? <img src={item.image} alt={item.name} /> : <PackageSearch className="browse-placeholder" size={35} />}<span className="item-status">{backendAuth ? item.status : 'Demo listing'}</span></div><div className="item-card-body"><div className="item-meta"><span>{item.category}</span><span>{item.date}</span></div><h3>{item.name}</h3><p><MapPin size={14} /> {item.location}</p></div></article>)}</div>{!filteredBrowseItems.length && <p className="empty-copy">No published items match your search.</p>}</>}</section>}
          {selectedItem && <div className="report-modal-backdrop"><div className="report-modal item-detail-modal"><button className="modal-close" type="button" onClick={() => setSelectedItem(null)}>×</button><div className="detail-image">{selectedItem.image ? <img src={selectedItem.image} alt={selectedItem.name} /> : <PackageSearch size={42} />}</div><div className="eyebrow">{selectedItem.type} item · {selectedItem.status}</div><h2>{selectedItem.name}</h2><p><strong>{selectedItem.category}</strong> · <MapPin size={13} /> {selectedItem.location} · {selectedItem.date}</p>{selectedItem.type === 'found' && <button className="button button-primary" type="button" onClick={() => setClaimItem(selectedItem)}>Submit a claim <ArrowRight size={17} /></button>}{selectedItem.type === 'lost' && backendAuth && <button className="button button-primary" type="button" onClick={() => setResponseItem(selectedItem)}>I saw this item <ArrowRight size={17} /></button>}</div></div>}
          {claimItem && <div className="report-modal-backdrop"><div className="report-modal"><button className="modal-close" type="button" onClick={() => setClaimItem(null)}>×</button><div className="eyebrow">Ownership verification</div><h2>Submit your claim.</h2><p>Private verification details are shared only with the finder. They are never shown on the public listing.</p><form onSubmit={submitClaim}><textarea required name="reason" rows="3" placeholder="Why do you believe this item belongs to you?" /><textarea required name="identifyingInformation" rows="3" placeholder="Private identifying details only the owner would know" /><textarea name="proofOfOwnership" rows="3" placeholder="Optional proof: receipt, serial number, or additional evidence" /><button className="button button-primary" type="submit">Send claim securely <ArrowRight size={17} /></button></form></div></div>}
          {responseItem && <div className="report-modal-backdrop"><div className="report-modal"><button className="modal-close" type="button" onClick={() => setResponseItem(null)}>×</button><div className="eyebrow">Help reunite this item</div><h2>Send a sighting.</h2><p>Your message goes privately to the lost-item owner. Do not include your phone number or other sensitive information.</p><form onSubmit={submitItemResponse}><textarea required name="message" rows="5" placeholder="Where did you see this item? Include useful details such as the time and campus area." /><button className="button button-primary" type="submit">Send message securely <ArrowRight size={17} /></button></form></div></div>}
          {reportType && <div className="report-modal-backdrop"><div className="report-modal"><button className="modal-close" type="button" onClick={() => setReportType(null)}>×</button><div className="eyebrow">{reportType === 'lost' ? 'Report a lost item' : 'Report a found item'}</div><h2>Tell us about it.</h2><p>Add enough detail to help your campus community recognise it.</p><form onSubmit={saveItem}><input required name="name" placeholder="Item name" /><select required name="category" defaultValue=""><option value="" disabled>Choose a category</option><option>Electronics</option><option>Bags</option><option>Wallets</option><option>Documents</option><option>Jewellery</option><option>Clothing</option><option>Books</option><option>Accessories</option><option>Keys</option><option>Other</option></select><input required name="location" placeholder="Where was it lost/found?" /><input required name="date" type="date" /><input name="image" type="file" accept="image/*" /><textarea required name="details" rows="3" placeholder="Description and identifying details" /><div className="form-actions"><button className="button button-primary" type="submit">Save report <Check size={17} /></button><button className="button button-quiet" type="button" onClick={() => setReportType(reportType === 'lost' ? 'found' : 'lost')}>Switch to {reportType === 'lost' ? 'found' : 'lost'}</button></div></form></div></div>}
        </main>
      </div>
    </div>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeForm, setActiveForm] = useState(null)
  const [showAllItems, setShowAllItems] = useState(false)
  const [savedItems, setSavedItems] = useState([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [authUser, setAuthUser] = useState(getStoredAuth)

  const closeMenu = () => setMenuOpen(false)
  const openForm = (type) => {
    setActiveForm(type)
    setNotice('')
    setError('')
    closeMenu()
    window.setTimeout(() => document.getElementById('report-form')?.scrollIntoView({ behavior: 'smooth' }), 0)
  }
  const toggleSaved = (name) => {
    setSavedItems((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name])
  }
  const handleSubmit = async (event) => {
    event.preventDefault()
    setNotice('')
    setError('')
    const formData = new FormData(event.currentTarget)
    if (activeForm === 'login' || activeForm === 'signup') {
      const email = String(formData.get('email')).trim().toLowerCase()
      const password = String(formData.get('password'))
      try {
        const response = await apiFetch(`/api/auth/${activeForm === 'login' ? 'login' : 'register'}`, null, {
          method: 'POST',
          body: JSON.stringify({
            ...(activeForm === 'signup' ? { name: formData.get('name') } : {}),
            email,
            password,
          }),
        })
        if (response.ok) {
          const result = await response.json()
          localStorage.setItem('findora-auth', JSON.stringify(result))
          setAuthUser(result)
          return
        }
        const backendUnavailable = [404, 500, 502, 503, 504].includes(response.status)
        if (!backendUnavailable) {
          const result = await response.json().catch(() => ({}))
          setError(result.message || 'Authentication failed')
          return
        }
      } catch {
        // The local demo account path below keeps the existing offline experience available.
      }
      const accounts = JSON.parse(localStorage.getItem('findora-accounts') || '{}')
      if (activeForm === 'signup') {
        if (accounts[email]) {
          setError('An account already exists for this email. Please sign in instead.')
          return
        }
        accounts[email] = { name: String(formData.get('name')).trim(), password }
        localStorage.setItem('findora-accounts', JSON.stringify(accounts))
      } else if (!accounts[email] || accounts[email].password !== password) {
        setError('Incorrect email or password. Create an account first if you are new to Findora.')
        return
      }
      const result = { token: `findora-local-${Date.now()}`, name: accounts[email].name, email, role: 'USER' }
      localStorage.setItem('findora-auth', JSON.stringify(result))
      setAuthUser(result)
      return
    }
    const itemKey = `findora-items-${authUser?.email || 'guest'}`
    const savedItemsForUser = JSON.parse(localStorage.getItem(itemKey) || '[]')
    savedItemsForUser.unshift({
      id: `${Date.now()}`,
      type: activeForm,
      name: String(formData.get('itemName')).trim(),
      category: String(formData.get('category')),
      location: 'Not specified',
      date: new Date().toISOString().slice(0, 10),
      details: String(formData.get('details')).trim(),
    })
    localStorage.setItem(itemKey, JSON.stringify(savedItemsForUser))
    setNotice('Your report was saved in this browser and is ready for review.')
  }

  if (authUser) {
    return <Dashboard user={authUser} onLogout={() => { localStorage.removeItem('findora-auth'); setAuthUser(null) }} />
  }
  if (activeForm === 'login' || activeForm === 'signup') {
    return <AuthPage mode={activeForm} onModeChange={(mode) => { setActiveForm(mode); setError('') }} onSubmit={handleSubmit} onBack={() => setActiveForm(null)} error={error} />
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <nav className="nav container" aria-label="Main navigation">
          <a className="brand" href="#home" onClick={closeMenu} aria-label="Findora home">
            <span className="brand-mark">
              <PackageSearch size={20} strokeWidth={2.5} />
            </span>
            <span>findora</span>
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className={`nav-content ${menuOpen ? 'is-open' : ''}`}>
            <div className="nav-links">
              <a href="#home" onClick={closeMenu}>Home</a>
              <a href="#browse" onClick={closeMenu}>Browse items</a>
              <a href="#how-it-works" onClick={closeMenu}>How it works</a>
              <a href="#about" onClick={closeMenu}>About</a>
            </div>
            <div className="nav-actions">
              <button className="login-link link-button" type="button" onClick={() => openForm('login')}>Log in</button>
              <button className="button button-small button-dark" type="button" onClick={() => openForm('signup')}>Join Findora <ArrowRight size={16} /></button>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero container" id="home">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> Built for better reunions</div>
            <h1>Lost something?<br /><em>Let&apos;s find it.</em></h1>
            <p className="hero-description">
              Findora makes recovering your belongings simple. A smarter way for your campus community to report, discover and reunite with what matters.
            </p>
            <div className="hero-actions">
              <button className="button button-primary" type="button" onClick={() => openForm('lost')}>Report a lost item <ArrowRight size={17} /></button>
              <a className="button button-quiet" href="#browse">Browse found items <Search size={17} /></a>
            </div>
            <div className="hero-trust">
              <div className="avatar-stack" aria-hidden="true">
                <span>AC</span><span>JR</span><span>NS</span><span>+</span>
              </div>
              <span><strong>Loved by 8,900+</strong><br />students on campus</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="A selection of found item illustrations">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-card card-main">
              <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85" alt="Silver watch that has been found" />
              <div className="found-pill"><span className="pulse-dot" /> Found near Library</div>
            </div>
            <div className="visual-card card-small card-headphones">
              <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=85" alt="Black headphones" />
              <span>Headphones</span>
            </div>
            <div className="visual-card card-small card-backpack">
              <img src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=85" alt="Canvas backpack" />
              <span>Backpack</span>
            </div>
            <div className="match-bubble"><Check size={16} /><span><strong>It&apos;s a match!</strong><small>We found something for you</small></span></div>
          </div>
        </section>

        <section className="stats-strip">
          <div className="container stats-grid">
            {stats.map(({ value, label, icon: Icon }) => (
              <div className="stat" key={label}>
                <span className="stat-icon"><Icon size={20} /></span>
                <div><strong>{value}</strong><span>{label}</span></div>
              </div>
            ))}
            <div className="stat-note"><span className="status-dot" /> Helping your campus reconnect, one item at a time.</div>
          </div>
        </section>

        <section className="section container" id="browse">
          <div className="section-heading">
            <div><div className="eyebrow">Recently found</div><h2>Maybe it&apos;s yours?</h2></div>
            <button className="text-link link-button" type="button" onClick={() => setShowAllItems((visible) => !visible)}>{showAllItems ? 'Show fewer items' : 'View all items'} <ArrowRight size={16} /></button>
          </div>
          <div className="item-grid">
            {foundItems.slice(0, showAllItems ? foundItems.length : 3).map((item) => (
              <article className="item-card" key={item.name}>
                <div className={`item-image ${item.color}`}><img src={item.image} alt={item.name} /><span className="item-status"><span className="pulse-dot" /> Found</span><button className={savedItems.includes(item.name) ? 'is-saved' : ''} aria-label={`Save ${item.name}`} type="button" onClick={() => toggleSaved(item.name)}><HeartHandshake size={17} /></button></div>
                <div className="item-card-body"><div className="item-meta"><span>{item.category}</span><span>{item.date}</span></div><h3>{item.name}</h3><p><MapPin size={14} /> {item.location}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="container how-layout">
            <div className="how-copy"><div className="eyebrow">A better way to reunite</div><h2>From lost to found<br /><em>in three simple steps.</em></h2><p>We bring your campus community together with thoughtful tools that make every reunion feel effortless.</p><button className="button button-dark" type="button" onClick={() => openForm('found')}>Report a found item <ArrowRight size={17} /></button></div>
            <div className="steps">
              <div className="step"><span className="step-number">01</span><div className="step-icon"><Search size={22} /></div><div><h3>Report it</h3><p>Tell us what went missing or what you found. It only takes a minute.</p></div></div>
              <div className="step"><span className="step-number">02</span><div className="step-icon"><Sparkles size={22} /></div><div><h3>We match it</h3><p>Our smart matching finds connections across items, places and details.</p></div></div>
              <div className="step"><span className="step-number">03</span><div className="step-icon"><HeartHandshake size={22} /></div><div><h3>Get reunited</h3><p>Connect securely and get your belongings back where they belong.</p></div></div>
            </div>
          </div>
        </section>

        <section className="why-section container" id="about">
          <div className="section-heading centered"><div><div className="eyebrow">Why Findora</div><h2>Good things happen<br /><em>when we look out for each other.</em></h2></div></div>
          <div className="feature-grid">
            <div className="feature-card feature-purple"><span className="feature-icon"><Sparkles /></span><h3>Smart matching</h3><p>Findora looks beyond keywords to connect the details that make your item uniquely yours.</p><a href="#matches">Explore matching <ArrowRight size={16} /></a></div>
            <div className="feature-card feature-yellow"><span className="feature-icon"><ShieldCheck /></span><h3>Safe by design</h3><p>Your privacy comes first. Share only what&apos;s needed, and keep conversations in one secure place.</p><a href="#safety">Our approach to safety <ArrowRight size={16} /></a></div>
            <div className="feature-card feature-blue"><span className="feature-icon"><BellRing /></span><h3>Stay in the loop</h3><p>Get a gentle nudge when we spot a possible match, so you never miss a chance to reunite.</p><a href="#notifications">See how it works <ArrowRight size={16} /></a></div>
          </div>
        </section>

        <section className="cta-section container" id="signup">
          <div className="cta-card"><div><div className="eyebrow">Your next reunion starts here</div><h2>Ready to find<br /><em>what matters?</em></h2></div><div><p>Join a community that believes every lost item has a way home.</p><button className="button button-dark" type="button" onClick={() => openForm('signup')}>Create your free account <ArrowRight size={17} /></button></div></div>
        </section>

        <section className="report-section container" id="report-form">
          <div className="report-card">
            <div className="eyebrow">{activeForm === 'found' ? 'Report a found item' : activeForm === 'lost' ? 'Report a lost item' : 'Get started'}</div>
            <h2>{activeForm === 'login' ? 'Welcome back.' : activeForm === 'signup' ? 'Join Findora.' : 'Tell us about it.'}</h2>
            {notice ? <div className="success-message"><Check size={17} /> {notice}</div> : (
              <form onSubmit={handleSubmit}>
                {activeForm === 'signup' && <input required name="name" placeholder="Full name" />}
                {activeForm === 'login' || activeForm === 'signup' ? <input required name="email" type="email" placeholder="University email" /> : <input required name="itemName" placeholder="Item name" />}
                {activeForm === 'login' || activeForm === 'signup' ? <input required name="password" type="password" placeholder="Password" /> : <><select required name="category" defaultValue=""><option value="" disabled>Choose a category</option><option>Electronics</option><option>Bags</option><option>Wallets</option><option>Documents</option><option>Accessories</option><option>Other</option></select><textarea required name="details" placeholder="Add a few identifying details" rows="3" /></>}
                <div className="form-actions"><button className="button button-primary" type="submit">{activeForm === 'login' ? 'Log in' : activeForm === 'signup' ? 'Create account' : 'Submit report'} <ArrowRight size={17} /></button><button className="button button-quiet" type="button" onClick={() => setActiveForm(null)}>Cancel</button></div>
              </form>
            )}
            {error && <div className="error-message">{error}</div>}
          </div>
        </section>
      </main>

      <footer className="footer" id="login">
        <div className="container footer-top"><div><a className="brand" href="#home"><span className="brand-mark"><PackageSearch size={20} strokeWidth={2.5} /></span><span>findora</span></a><p>Lost. Found. Reunited.<br />Making campus feel a little more connected.</p></div><div className="footer-links"><div><strong>Explore</strong><a href="#browse">Browse items</a><a href="#how-it-works">How it works</a><a href="#about">About Findora</a></div><div><strong>Get started</strong><a href="#report-lost">Report lost item</a><a href="#report-found">Report found item</a><a href="#signup">Create an account</a></div><div><strong>Need help?</strong><a href="#help">Help centre</a><a href="#contact">Contact us</a><a href="#privacy">Privacy & safety</a></div></div></div>
        <div className="container footer-bottom"><span>© 2025 Findora. Built for better reunions.</span><div className="socials"><a href="#facebook" aria-label="Facebook"><Facebook size={16} /></a><a href="#instagram" aria-label="Instagram"><Instagram size={16} /></a><a href="#linkedin" aria-label="LinkedIn"><Linkedin size={16} /></a></div></div>
      </footer>
    </div>
  )
}

export default App
