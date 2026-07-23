namespace MFC_Youth_Database.Update
{
    public static class GitHubConfig
    {
        public const string Owner = "migzdndd";

        public const string Repository = "MFC-Youth-Area-Management-System";

        public const string UserAgent =
            "MFC-Youth-Area-Management-System";

        public static string ApiUrl
        {
            get
            {
                return "https://api.github.com/repos/"
                    + Owner
                    + "/"
                    + Repository
                    + "/releases/latest";
            }
        }

        public static string ReleasesUrl
        {
            get
            {
                return "https://github.com/"
                    + Owner
                    + "/"
                    + Repository
                    + "/releases";
            }
        }
    }
}