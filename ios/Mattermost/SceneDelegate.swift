import UIKit
import UserNotifications

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    private var appDelegate: AppDelegate? {
        UIApplication.shared.delegate as? AppDelegate
    }

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene, let appDelegate else {
            return
        }

        // Scene launch context replaces the URL and notification launch options
        // previously delivered to UIApplicationDelegate.
        var launchOptions = appDelegate.launchOptions ?? [:]
        if let context = connectionOptions.urlContexts.first {
            launchOptions[.url] = context.url
            launchOptions[.sourceApplication] = context.options.sourceApplication
        }
        if let activity = connectionOptions.userActivities.first(where: { $0.activityType == NSUserActivityTypeBrowsingWeb }) {
            launchOptions[.userActivityDictionary] = [
                "UIApplicationLaunchOptionsUserActivityTypeKey": activity.activityType,
                "UIApplicationLaunchOptionsUserActivityKey": activity,
            ]
        }
        if let response = connectionOptions.notificationResponse {
            launchOptions[.remoteNotification] = response.notification.request.content.userInfo
        }

        // Seed Expo's initial URL before JavaScript starts; warm links use these
        // same app-delegate handlers, including the existing MSAL integration.
        self.scene(scene, openURLContexts: connectionOptions.urlContexts)
        for activity in connectionOptions.userActivities {
            self.scene(scene, continue: activity)
        }

        let sceneWindow = UIWindow(windowScene: windowScene)
        window = sceneWindow
        appDelegate.startReactNative(in: sceneWindow, launchOptions: launchOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            var options: [UIApplication.OpenURLOptionsKey: Any] = [
                .openInPlace: context.options.openInPlace,
            ]
            options[.sourceApplication] = context.options.sourceApplication
            options[.annotation] = context.options.annotation
            _ = appDelegate?.application(UIApplication.shared, open: context.url, options: options)
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = appDelegate?.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }

    // This app supports one scene. Keep Expo subscribers and database lock
    // protection connected to the lifecycle callbacks UIKit now sends here.
    func sceneDidBecomeActive(_ scene: UIScene) {
        appDelegate?.applicationDidBecomeActive(UIApplication.shared)
    }

    func sceneWillResignActive(_ scene: UIScene) {
        appDelegate?.applicationWillResignActive(UIApplication.shared)
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
        appDelegate?.applicationDidEnterBackground(UIApplication.shared)
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
        appDelegate?.applicationWillEnterForeground(UIApplication.shared)
    }
}
