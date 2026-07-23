using System;
using System.Reflection;

namespace MFC_Youth_Database.Update
{
    public static class VersionHelper
    {
        public static Version GetCurrentVersion()
        {
            return Assembly.GetExecutingAssembly().GetName().Version;
        }

        public static string GetCurrentVersionString()
        {
            return GetCurrentVersion().ToString();
        }

        public static bool IsUpdateAvailable(Version latestVersion)
        {
            return latestVersion > GetCurrentVersion();
        }
    }
}