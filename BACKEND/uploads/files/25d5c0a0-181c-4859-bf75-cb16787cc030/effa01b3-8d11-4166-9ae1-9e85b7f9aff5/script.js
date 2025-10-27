/**
 * VisioConf - Script JavaScript principal
 * Gestion de l'interface utilisateur et des interactions
 */

// Configuration globale
const CONFIG = {
    API_BASE_URL: "/api",
    WEBSOCKET_URL: "ws://localhost:3000",
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_FILE_TYPES: ["pdf", "doc", "docx", "txt", "jpg", "png", "gif"],
    REFRESH_INTERVAL: 30000, // 30 secondes
}

// État global de l'application
const AppState = {
    currentUser: null,
    activeTeam: null,
    notifications: [],
    isConnected: false,
}

/**
 * Initialisation de l'application
 */
document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Initialisation de VisioConf...")

    initializeApp()
    setupEventListeners()
    loadUserData()
    startPeriodicUpdates()
})

/**
 * Initialisation des composants principaux
 */
function initializeApp() {
    // Vérification de la compatibilité du navigateur
    if (!checkBrowserCompatibility()) {
        showError(
            "Votre navigateur n'est pas compatible avec VisioConf. Veuillez utiliser une version récente de Chrome, Firefox ou Safari."
        )
        return
    }

    // Initialisation des statistiques
    animateCounters()

    // Configuration des tooltips
    initializeTooltips()

    // Chargement des données initiales
    loadDashboardData()
}

/**
 * Configuration des écouteurs d'événements
 */
function setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", handleNavigation)
    })

    // Menu utilisateur
    const userMenu = document.querySelector(".user-menu")
    if (userMenu) {
        userMenu.addEventListener("click", toggleUserDropdown)
    }

    // Gestion des erreurs globales
    window.addEventListener("error", handleGlobalError)
    window.addEventListener("unhandledrejection", handlePromiseRejection)

    // Responsive
    window.addEventListener("resize", handleResize)
}

/**
 * Animation des compteurs dans la section hero
 */
function animateCounters() {
    const counters = document.querySelectorAll(".stat-number")

    counters.forEach((counter) => {
        const target = parseInt(counter.getAttribute("data-target") || "0")
        const duration = 2000 // 2 secondes
        const increment = target / (duration / 16) // 60 FPS
        let current = 0

        const updateCounter = () => {
            current += increment
            if (current < target) {
                counter.textContent = Math.floor(current)
                requestAnimationFrame(updateCounter)
            } else {
                counter.textContent = target
            }
        }

        // Démarrer l'animation quand l'élément est visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    updateCounter()
                    observer.unobserve(entry.target)
                }
            })
        })

        observer.observe(counter)
    })
}

/**
 * Navigation entre les sections
 */
function handleNavigation(event) {
    event.preventDefault()

    const targetSection = event.target.getAttribute("href")
    const currentActive = document.querySelector(".nav-link.active")

    // Mise à jour des états actifs
    if (currentActive) {
        currentActive.classList.remove("active")
    }
    event.target.classList.add("active")

    // Navigation fluide
    if (targetSection.startsWith("#")) {
        const targetElement = document.querySelector(targetSection)
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
            })
        }
    } else {
        // Navigation vers une autre page
        window.location.href = targetSection
    }
}

/**
 * Chargement des données utilisateur
 */
async function loadUserData() {
    try {
        showLoading("user-menu")

        const response = await fetch(`${CONFIG.API_BASE_URL}/user/profile`, {
            headers: {
                Authorization: `Bearer ${getAuthToken()}`,
            },
        })

        if (!response.ok) {
            throw new Error("Erreur lors du chargement du profil utilisateur")
        }

        const userData = await response.json()
        AppState.currentUser = userData

        updateUserInterface(userData)
    } catch (error) {
        console.error("Erreur de chargement utilisateur:", error)
        showError("Impossible de charger les informations utilisateur")
    } finally {
        hideLoading("user-menu")
    }
}

/**
 * Chargement des données du tableau de bord
 */
async function loadDashboardData() {
    try {
        const [statsResponse, activityResponse] = await Promise.all([
            fetch(`${CONFIG.API_BASE_URL}/dashboard/stats`),
            fetch(`${CONFIG.API_BASE_URL}/dashboard/activity`),
        ])

        if (statsResponse.ok) {
            const stats = await statsResponse.json()
            updateStatistics(stats)
        }

        if (activityResponse.ok) {
            const activity = await activityResponse.json()
            updateActivityList(activity)
        }
    } catch (error) {
        console.error("Erreur de chargement du tableau de bord:", error)
    }
}

/**
 * Mise à jour des statistiques
 */
function updateStatistics(stats) {
    const usersCounter = document.getElementById("users-count")
    const teamsCounter = document.getElementById("teams-count")
    const filesCounter = document.getElementById("files-count")

    if (usersCounter) {
        usersCounter.setAttribute("data-target", stats.activeUsers || 0)
    }
    if (teamsCounter) {
        teamsCounter.setAttribute("data-target", stats.totalTeams || 0)
    }
    if (filesCounter) {
        filesCounter.setAttribute("data-target", stats.sharedFiles || 0)
    }

    // Redémarrer l'animation
    animateCounters()
}

/**
 * Mise à jour de la liste d'activité
 */
function updateActivityList(activities) {
    const activityList = document.getElementById("activity-list")
    if (!activityList) return

    if (!activities || activities.length === 0) {
        activityList.innerHTML =
            '<p class="no-activity">Aucune activité récente</p>'
        return
    }

    const html = activities
        .map(
            (activity) => `
        <div class="activity-item">
            <div class="activity-icon">${getActivityIcon(activity.type)}</div>
            <div class="activity-content">
                <p class="activity-text">${activity.description}</p>
                <span class="activity-time">${formatRelativeTime(
                    activity.timestamp
                )}</span>
            </div>
        </div>
    `
        )
        .join("")

    activityList.innerHTML = html
}

/**
 * Gestion du menu déroulant utilisateur
 */
function toggleUserDropdown(event) {
    event.stopPropagation()

    const existingDropdown = document.querySelector(".user-dropdown")
    if (existingDropdown) {
        existingDropdown.remove()
        return
    }

    const dropdown = document.createElement("div")
    dropdown.className = "user-dropdown"
    dropdown.innerHTML = `
        <div class="dropdown-item" onclick="viewProfile()">
            <span>👤</span> Mon profil
        </div>
        <div class="dropdown-item" onclick="openSettings()">
            <span>⚙️</span> Paramètres
        </div>
        <div class="dropdown-separator"></div>
        <div class="dropdown-item" onclick="logout()">
            <span>🚪</span> Se déconnecter
        </div>
    `

    document.body.appendChild(dropdown)

    // Positionnement du dropdown
    const userMenuRect = event.currentTarget.getBoundingClientRect()
    dropdown.style.position = "absolute"
    dropdown.style.top = `${userMenuRect.bottom + 8}px`
    dropdown.style.right = `${window.innerWidth - userMenuRect.right}px`

    // Fermeture au clic extérieur
    document.addEventListener("click", closeUserDropdown, { once: true })
}

/**
 * Fermeture du menu utilisateur
 */
function closeUserDropdown() {
    const dropdown = document.querySelector(".user-dropdown")
    if (dropdown) {
        dropdown.remove()
    }
}

/**
 * Vérification de la compatibilité du navigateur
 */
function checkBrowserCompatibility() {
    // Vérifications basiques
    return !!(
        window.fetch &&
        window.Promise &&
        window.localStorage &&
        document.querySelector &&
        window.addEventListener
    )
}

/**
 * Initialisation des tooltips
 */
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll("[data-tooltip]")

    tooltipElements.forEach((element) => {
        element.addEventListener("mouseenter", showTooltip)
        element.addEventListener("mouseleave", hideTooltip)
    })
}

/**
 * Mises à jour périodiques
 */
function startPeriodicUpdates() {
    setInterval(() => {
        if (AppState.isConnected && document.visibilityState === "visible") {
            loadDashboardData()
        }
    }, CONFIG.REFRESH_INTERVAL)
}

/**
 * Utilities
 */
function getAuthToken() {
    return localStorage.getItem("auth_token") || ""
}

function formatRelativeTime(timestamp) {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now - time) / 1000)

    if (diffInSeconds < 60) return "À l'instant"
    if (diffInSeconds < 3600)
        return `Il y a ${Math.floor(diffInSeconds / 60)} min`
    if (diffInSeconds < 86400)
        return `Il y a ${Math.floor(diffInSeconds / 3600)} h`
    return `Il y a ${Math.floor(diffInSeconds / 86400)} j`
}

function getActivityIcon(type) {
    const icons = {
        file_upload: "📁",
        message: "💬",
        call: "📞",
        team_join: "👥",
        default: "📋",
    }
    return icons[type] || icons.default
}

function showLoading(elementId) {
    const element = document.getElementById(elementId)
    if (element) {
        element.classList.add("loading")
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId)
    if (element) {
        element.classList.remove("loading")
    }
}

function showError(message) {
    console.error(message)
    // Ici vous pourriez implémenter un système de notification
    alert(message) // Temporaire
}

function handleGlobalError(event) {
    console.error("Erreur globale:", event.error)
}

function handlePromiseRejection(event) {
    console.error("Promesse rejetée:", event.reason)
}

function handleResize() {
    // Gestion du redimensionnement si nécessaire
}

// Fonctions d'action pour le menu utilisateur
function viewProfile() {
    console.log("Voir le profil")
    closeUserDropdown()
}

function openSettings() {
    console.log("Ouvrir les paramètres")
    closeUserDropdown()
}

function logout() {
    localStorage.removeItem("auth_token")
    window.location.href = "/login"
}

// Export pour les modules ES6 (si utilisé)
if (typeof module !== "undefined" && module.exports) {
    module.exports = { AppState, CONFIG }
}
