using Newtonsoft.Json;
using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace MFC_Youth_Database.Update
{
    public static class UpdateChecker
    {
        public static async Task<bool> IsUpdateAvailableAsync()
        {
            GitHubRelease release =
                await GetLatestReleaseAsync();

            return VersionHelper.IsUpdateAvailable(
                release.Version);
        }

        public static async Task<GitHubRelease> GetLatestReleaseAsync()
        {
            string url = GitHubConfig.ApiUrl;

            using (HttpClient client = new HttpClient())
            {
                client.DefaultRequestHeaders.UserAgent.ParseAdd(
                    GitHubConfig.UserAgent);

                string json = await client.GetStringAsync(url);

                return JsonConvert.DeserializeObject<GitHubRelease>(json);
            }
        }
    }
}