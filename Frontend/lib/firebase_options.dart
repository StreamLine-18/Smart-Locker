import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyB8B-x2eB3-nkDsbIHj1I52WafhFR6BW10',
    appId: '1:291828843752:web:946d1adb149a85e609755d',
    messagingSenderId: '291828843752',
    projectId: 'issmartlocker',
    authDomain: 'issmartlocker.firebaseapp.com',
    databaseURL: 'https://issmartlocker-default-rtdb.asia-southeast1.firebasedatabase.app',
    storageBucket: 'issmartlocker.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAPMb1k9nsf18aHU7JN4L_quEJsirsXm7g',
    appId: '1:291828843752:android:39fec1a61151c67309755d',
    messagingSenderId: '291828843752',
    projectId: 'issmartlocker',
    databaseURL: 'https://issmartlocker-default-rtdb.asia-southeast1.firebasedatabase.app',
    storageBucket: 'issmartlocker.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyCVBrna0KJn_E7nowWuYk2expcLtRN3iOE',
    appId: '1:291828843752:ios:613561d1513b55ea09755d',
    messagingSenderId: '291828843752',
    projectId: 'issmartlocker',
    databaseURL: 'https://issmartlocker-default-rtdb.asia-southeast1.firebasedatabase.app',
    storageBucket: 'issmartlocker.firebasestorage.app',
    iosClientId: '291828843752-nn30ctr2pneeqhitqt1cdtpu3ubml7kt.apps.googleusercontent.com',
    iosBundleId: 'com.example.smartlocker',
  );

}