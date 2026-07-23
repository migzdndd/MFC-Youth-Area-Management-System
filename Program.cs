using System;
using System.Windows.Forms;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Database
{
    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            DatabaseInitializer.Initialize();

            Application.Run(new Dashboard());
        }
    }
}