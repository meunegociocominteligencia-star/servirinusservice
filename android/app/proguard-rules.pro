# Add project specific ProGuard rules here.
# You can control what code gets obfuscated or shrunk.
# See http://proguard.sourceforge.net/index.html#manual/introduction.html

# Keep WebView and JavaScript interfaces safe from shrinking and obfuscation
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keep class android.webkit.** { *; }
