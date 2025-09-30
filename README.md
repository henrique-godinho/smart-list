# Smart List - Grocery List Management App

A modern, responsive grocery list management application built with Go backend and vanilla JavaScript frontend. Smart List helps users organize their shopping with multiple lists, item catalogs, and persistent storage.

## 🚀 Features

### 📝 List Management
- **Multiple Lists**: Create and manage multiple grocery lists simultaneously
- **List Metadata**: Set target dates and shopping frequencies for each list
- **Expandable Interface**: Collapsible list cards for better organization
- **Real-time Updates**: Instant UI updates with localStorage persistence

### 📦 Item Management
- **Add Items**: Add items manually or from the comprehensive catalog
- **Quantity Control**: Adjust item quantities with number inputs
- **Duplicate Detection**: Smart handling of duplicate items with user confirmation
- **Item Removal**: Easy deletion with visual feedback
- **Persistent Storage**: Items saved locally and synced with server

### 🛒 Catalog System
- **Categorized Items**: Browse items organized by categories (Produce, Dairy, etc.)
- **Search Functionality**: Real-time search across all catalog items
- **Quick Add**: One-click item addition from catalog to lists
- **Visual Feedback**: Confirmation animations when items are added

### 💾 Data Persistence
- **Local Storage**: Immediate persistence with localStorage
- **Server Sync**: Save lists to backend with visual status indicators
- **Offline Support**: Continue working even when offline
- **Data Recovery**: Automatic loading of saved data on page refresh

### 🎨 User Interface
- **Dark Theme**: Modern dark UI with turquoise accents
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Smooth Animations**: Polished interactions with CSS transitions
- **Accessibility**: Keyboard navigation and focus states
- **Visual Feedback**: Loading states, success/error indicators

## 🏗️ Architecture

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **CSS3**: Modern styling with flexbox and grid
- **Local Storage API**: Client-side data persistence
- **Fetch API**: RESTful communication with backend

### Backend (Go)
- **RESTful API**: Clean API endpoints for list management
- **Template Rendering**: Server-side HTML generation
- **User Authentication**: Session-based auth system
- **Database Integration**: Persistent data storage


## 🚀 Getting Started

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd smart-list
   ```

2. **Start Backend**
   ```bash
   go run main.go
   ```

3. **Access Application**
   - Landing page: `http://localhost:8080/`
   - Main app: `http://localhost:8080/main` (after login)

## 🔮 Future Enhancements

- **Offline PWA**: Service worker for full offline support
- **Sharing**: Share lists between users
- **Templates**: Reusable list templates
- **Analytics**: Shopping pattern insights
- **Integration**: Grocery store APIs for pricing
- **Mobile App**: Native mobile applications

## 🤝 Contributing

This project demonstrates modern web development practices with vanilla JavaScript and Go. The codebase is designed for maintainability and extensibility.

---

**Smart List** - Making grocery shopping smarter, one list at a time! 🛒✨