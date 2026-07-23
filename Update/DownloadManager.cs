using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;

namespace MFC_Youth_Database.Update
{
    public static class DownloadManager
    {
        public static async Task<string> DownloadUpdateAsync(string downloadUrl)
        {
            string tempFolder = Path.Combine(
                Path.GetTempPath(),
                "MFCYouthUpdater");

            if (!Directory.Exists(tempFolder))
            {
                Directory.CreateDirectory(tempFolder);
            }

            string destinationFile = Path.Combine(
                tempFolder,
                "update.zip");

            if (File.Exists(destinationFile))
            {
                File.Delete(destinationFile);
            }

            using (WebClient client = new WebClient())
            {
                client.Headers.Add(
                    HttpRequestHeader.UserAgent,
                    GitHubConfig.UserAgent);

                await client.DownloadFileTaskAsync(
                    new Uri(downloadUrl),
                    destinationFile);
            }

            if (!File.Exists(destinationFile))
            {
                throw new FileNotFoundException(
                    "The update package was not downloaded.");
            }

            FileInfo file = new FileInfo(destinationFile);

            if (file.Length == 0)
            {
                throw new InvalidDataException(
                    "The downloaded update package is empty.");
            }

            return destinationFile;
        }
    }
}