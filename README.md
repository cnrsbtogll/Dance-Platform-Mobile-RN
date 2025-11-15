# Feriha Dance Platform - Mobile React Native App

A comprehensive mobile application that connects dance students with professional instructors. Built with React Native, TypeScript, and Expo.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Mock Data](#mock-data)
- [Internationalization (i18n)](#internationalization-i18n)
- [Theme and Styling](#theme-and-styling)
- [Development Guidelines](#development-guidelines)
- [Build and Deployment](#build-and-deployment)
- [Troubleshooting](#troubleshooting)
- [Support and Contact](#support-and-contact)

## Project Overview

Feriha Dance Platform is a modern mobile application that brings dance enthusiasts together with professional instructors. The app supports multiple dance styles including Salsa, Bachata, Kizomba, Tango, and Modern Dance.

### Key Features

- **Student Module**: Discover lessons, book classes, manage bookings, and communicate with instructors
- **Instructor Module**: Create and manage lessons, track earnings, view statistics, and communicate with students
- **Shared Features**: Real-time messaging, notifications, profile management, and dark mode support

### Technology Stack

- **Framework**: React Native 0.74.5 with Expo SDK 51
- **Language**: TypeScript 5.3.3
- **State Management**: Zustand 5.0.8
- **Navigation**: React Navigation 7.x (Stack & Bottom Tabs)
- **Internationalization**: i18next & react-i18next
- **UI Components**: Custom components with Material Icons
- **Styling**: StyleSheet with theme-based design system

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Expo CLI**: Install globally with `npm install -g expo-cli`

### Platform-Specific Requirements

#### For iOS Development (Mac only)

- **Xcode**: 14.0 or higher ([Download from App Store](https://apps.apple.com/us/app/xcode/id497799835))
- **CocoaPods**: Install with `sudo gem install cocoapods`
- **iOS Simulator**: Included with Xcode

#### For Android Development

- **Android Studio**: Latest version ([Download](https://developer.android.com/studio))
- **Android SDK**: API Level 33 or higher
- **Android Emulator**: Set up through Android Studio

#### For Web Development

- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Installation

### Step 1: Clone or Download the Project

If you have the project files, navigate to the project directory:

```bash
cd Dance-Platform-Mobile-RN
```

### Step 2: Install Dependencies

Install all required npm packages:

```bash
npm install
```

This will install all dependencies listed in `package.json`, including:
- React Native and Expo packages
- Navigation libraries
- State management (Zustand)
- Internationalization libraries
- UI components and icons

### Step 3: iOS Setup (Mac only)

If you're developing for iOS, install CocoaPods dependencies:

```bash
cd ios
pod install
cd ..
```

**Note**: If you encounter CocoaPods issues, try:
```bash
sudo gem install cocoapods
pod repo update
```

### Step 4: Android Setup

Android setup is handled automatically by Expo. No additional steps required.

## Running the Project

### Development Mode

Start the Expo development server:

```bash
npm start
```

This will:
- Start the Metro bundler
- Display a QR code in the terminal
- Open Expo DevTools in your browser

### Running on iOS Simulator (Mac only)

```bash
npm run ios
```

This will:
- Build and launch the app in the iOS Simulator
- Automatically reload when you make changes

### Running on Android Emulator

First, ensure your Android emulator is running, then:

```bash
npm run android
```

This will:
- Build and launch the app in the Android Emulator
- Automatically reload when you make changes

### Running on Physical Device

1. Install the **Expo Go** app on your iOS or Android device:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Start the development server:
   ```bash
   npm start
   ```

3. Scan the QR code with:
   - **iOS**: Use the Camera app
   - **Android**: Use the Expo Go app

### Running on Web

```bash
npm start --web
```

Or:

```bash
npm run web
```

## Project Structure

```
Dance-Platform-Mobile-RN/
├── assets/                 # Images, icons, and static assets
│   ├── icon.png           # App icon
│   ├── splash.png         # Splash screen
│   └── lessons/           # Lesson images by category
├── src/
│   ├── assets/            # Additional assets (fonts, images)
│   ├── components/        # Reusable React components
│   │   ├── common/       # Common components (Card, Button, etc.)
│   │   ├── lesson/       # Lesson-specific components
│   │   └── instructor/   # Instructor-specific components
│   ├── screens/           # Screen components
│   │   ├── student/      # Student module screens
│   │   ├── instructor/   # Instructor module screens
│   │   └── shared/       # Shared screens (Profile, Settings, etc.)
│   ├── navigation/       # Navigation configuration
│   │   ├── RootNavigator.tsx
│   │   ├── StudentNavigator.tsx
│   │   └── InstructorNavigator.tsx
│   ├── data/            # Mock data JSON files
│   │   ├── users.json
│   │   ├── lessons.json
│   │   ├── bookings.json
│   │   ├── messages.json
│   │   ├── notifications.json
│   │   └── reviews.json
│   ├── services/         # Service layer
│   │   ├── mockDataService.ts
│   │   └── firebase/     # Firebase integration (planned)
│   ├── store/           # Zustand state management
│   │   ├── useAuthStore.ts
│   │   ├── useLessonStore.ts
│   │   ├── useBookingStore.ts
│   │   ├── useNotificationStore.ts
│   │   ├── useProfileStore.ts
│   │   └── useThemeStore.ts
│   ├── types/           # TypeScript type definitions
│   │   ├── user.ts
│   │   ├── lesson.ts
│   │   ├── booking.ts
│   │   ├── message.ts
│   │   ├── notification.ts
│   │   ├── review.ts
│   │   └── index.ts
│   └── utils/           # Utility functions and helpers
│       ├── theme.ts     # Theme configuration
│       ├── helpers.ts   # Helper functions
│       ├── constants.ts # App constants
│       ├── i18n.ts      # Internationalization setup
│       ├── imageHelper.ts # Image loading helpers
│       ├── avatars.ts   # Avatar URLs
│       └── whatsapp.ts  # WhatsApp integration
├── app.json             # Expo configuration
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md           # This file
```

### Key Files Explained

- **App.tsx**: Main entry point of the application
- **src/navigation/RootNavigator.tsx**: Root navigation structure
- **src/utils/theme.ts**: Theme colors, spacing, and typography
- **src/services/mockDataService.ts**: Service layer for data operations
- **src/store/**: Zustand stores for global state management

## Configuration

### App Configuration (`app.json`)

The `app.json` file contains Expo configuration:

```json
{
  "expo": {
    "name": "Dance Platform",
    "slug": "dance-platform",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.danceplatform.app"
    },
    "android": {
      "package": "com.danceplatform.app"
    }
  }
}
```

### Environment Variables

Currently, the app uses mock data. For production, you may want to add environment variables for:
- API endpoints
- Firebase configuration
- Stripe keys (for payments)

Create a `.env` file in the root directory (not included in the repository):

```env
API_URL=https://api.example.com
FIREBASE_API_KEY=your_api_key
STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

### Firebase Setup (Future Integration)

Firebase integration is planned. Configuration files are located in `src/services/firebase/`. See `src/services/firebase/README.md` for details.

## Mock Data

The application currently uses mock data stored in JSON files located in `src/data/`:

- **users.json**: User accounts (students and instructors)
- **lessons.json**: Available dance lessons
- **bookings.json**: Lesson bookings and reservations
- **messages.json**: Chat messages between users
- **notifications.json**: User notifications
- **reviews.json**: Lesson reviews and ratings

### Modifying Mock Data

To modify mock data:

1. Open the relevant JSON file in `src/data/`
2. Edit the data structure
3. Save the file
4. The app will automatically reload with new data

### Data Structure Examples

**User Structure**:
```json
{
  "id": "user1",
  "name": "John Smith",
  "email": "john@example.com",
  "role": "student",
  "avatar": "https://...",
  "bio": "Dance enthusiast",
  "rating": 0,
  "totalLessons": 0,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Lesson Structure**:
```json
{
  "id": "lesson1",
  "instructorId": "instructor1",
  "title": "Salsa Fundamentals",
  "description": "Learn the basics of Salsa dancing",
  "category": "Salsa",
  "price": 50,
  "duration": 60,
  "imageUrl": "salsa-1.jpeg",
  "rating": 4.8,
  "totalBookings": 32,
  "date": "2024-12-15",
  "time": "18:00",
  "createdAt": "2024-01-10T08:00:00Z"
}
```

## Internationalization (i18n)

The app supports multiple languages through i18next. Currently supported languages:

- **Turkish (tr)**: Default language
- **English (en)**: Secondary language

### Translation Files

Translation files are located in `src/locales/`:
- `tr.json`: Turkish translations
- `en.json`: English translations

### Adding a New Language

1. Create a new JSON file in `src/locales/` (e.g., `de.json` for German)
2. Copy the structure from `en.json`
3. Translate all values
4. Update `src/utils/i18n.ts` to include the new language:

```typescript
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    tr: { translation: tr },
    de: { translation: de }, // Add new language
  },
  // ...
});
```

### Using Translations in Components

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return <Text>{t('common.welcome')}</Text>;
};
```

## Theme and Styling

The app uses a comprehensive theme system located in `src/utils/theme.ts`.

### Theme Structure

- **Colors**: Role-based colors (student/instructor) with light/dark variants
- **Spacing**: Consistent spacing scale (xs, sm, md, lg, xl, xxl)
- **Typography**: Font sizes and weights
- **Border Radius**: Consistent border radius values

### Dark Mode Support

Dark mode is fully supported and can be toggled in the profile settings. The theme automatically adjusts colors based on the current mode.

### Using the Theme

```typescript
import { getPalette, spacing, typography } from '../../utils/theme';
import { useThemeStore } from '../../store/useThemeStore';

const MyComponent = () => {
  const { isDarkMode } = useThemeStore();
  const palette = getPalette('student', isDarkMode);
  
  return (
    <View style={{ backgroundColor: palette.background }}>
      <Text style={{ color: palette.text.primary, fontSize: typography.fontSize.base }}>
        Hello World
      </Text>
    </View>
  );
};
```

### Customizing the Theme

Edit `src/utils/theme.ts` to modify:
- Color schemes
- Spacing values
- Typography settings
- Border radius values

## Development Guidelines

### Code Structure

- **Components**: Use functional components with TypeScript
- **State Management**: Use Zustand for global state, useState for local state
- **Styling**: Use StyleSheet.create for component styles
- **Navigation**: Use React Navigation hooks (useNavigation, useRoute)

### Adding a New Screen

1. Create the screen component in the appropriate folder:
   - `src/screens/student/` for student screens
   - `src/screens/instructor/` for instructor screens
   - `src/screens/shared/` for shared screens

2. Add the screen to the navigation:
   - Update `StudentNavigator.tsx` or `InstructorNavigator.tsx`
   - Add navigation options (header, title, etc.)

3. Add translations:
   - Add translation keys to `src/locales/tr.json` and `src/locales/en.json`

### Adding a New Component

1. Create the component in `src/components/common/` or appropriate subfolder
2. Define TypeScript interfaces for props
3. Use the theme system for styling
4. Export the component

### State Management with Zustand

Example store:

```typescript
import { create } from 'zustand';

interface MyStore {
  data: string[];
  setData: (data: string[]) => void;
}

export const useMyStore = create<MyStore>((set) => ({
  data: [],
  setData: (data) => set({ data }),
}));
```

## Build and Deployment

### Building for Production

#### iOS

1. Configure app in `app.json`
2. Build with EAS Build:
   ```bash
   npm install -g eas-cli
   eas build --platform ios
   ```

Or use Expo's build service:
```bash
expo build:ios
```

#### Android

1. Configure app in `app.json`
2. Build with EAS Build:
   ```bash
   eas build --platform android
   ```

Or use Expo's build service:
```bash
expo build:android
```

### App Store Preparation (iOS)

1. Ensure all app icons and splash screens are properly configured
2. Update version number in `app.json`
3. Build the app using EAS Build or Expo's build service
4. Submit to App Store Connect

### Google Play Store Preparation (Android)

1. Ensure all app icons and splash screens are properly configured
2. Update version number in `app.json`
3. Build the app using EAS Build or Expo's build service
4. Generate a signed APK or AAB
5. Submit to Google Play Console

## Troubleshooting

### Common Issues

#### Metro Bundler Issues

**Problem**: Metro bundler not starting or cache issues

**Solution**:
```bash
npm start -- --reset-cache
```

Or:
```bash
npx expo start --clear
```

#### iOS Build Issues

**Problem**: CocoaPods installation fails

**Solution**:
```bash
cd ios
pod deintegrate
pod install
cd ..
```

#### Android Build Issues

**Problem**: Gradle build fails

**Solution**:
```bash
cd android
./gradlew clean
cd ..
```

#### TypeScript Errors

**Problem**: Type errors after updating dependencies

**Solution**:
```bash
npm install
npx tsc --noEmit
```

#### Navigation Issues

**Problem**: Navigation not working or screen not found

**Solution**:
- Check that the screen is properly registered in the navigator
- Ensure screen names match exactly (case-sensitive)
- Check navigation params are correctly typed

#### Dark Mode Not Working

**Problem**: Dark mode not applying correctly

**Solution**:
- Check `useThemeStore` is properly initialized
- Verify `getPalette` is called with correct parameters
- Ensure theme colors are properly defined in `theme.ts`

### iOS-Specific Issues

#### Simulator Not Launching

**Solution**:
- Ensure Xcode is properly installed
- Check iOS Simulator is available: `xcrun simctl list devices`
- Try: `npm run ios -- --simulator="iPhone 14"`

#### CocoaPods Version Issues

**Solution**:
```bash
sudo gem install cocoapods
pod repo update
```

### Android-Specific Issues

#### Emulator Not Found

**Solution**:
- Ensure Android Studio is installed
- Start an emulator from Android Studio
- Check: `adb devices` to see connected devices

#### Gradle Sync Issues

**Solution**:
```bash
cd android
./gradlew clean
./gradlew build
cd ..
```

## Support and Contact

For support, questions, or feature requests, please contact:

**Email**: cnrsbtogll@gmail.com

### Reporting Issues

When reporting issues, please include:
- Device/OS version
- React Native version
- Expo SDK version
- Steps to reproduce
- Error messages or logs
- Screenshots (if applicable)

## License

This project is proprietary software. All rights reserved.

---

**Version**: 1.0.0  
**Last Updated**: December 2024
