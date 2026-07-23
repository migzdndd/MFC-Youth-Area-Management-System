using System;
using System.Collections.Generic;

namespace MFC_Youth_Database.Update
{
    public class GitHubRelease
    {
        public string tag_name { get; set; }

        public string name { get; set; }

        public string body { get; set; }

        public List<GitHubAsset> assets { get; set; }

        public Version Version
        {
            get
            {
                return new Version(
                    tag_name.TrimStart('v', 'V'));
            }
        }
    }

    public class GitHubAsset
    {
        public string name { get; set; }

        public string browser_download_url { get; set; }

        public long size { get; set; }
    }
}