using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Data.SQLite;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using MFC_Youth_Database.Database;
using MFC_Youth_Database.Forms;

namespace MFC_Youth_Database
{
    public partial class Dashboard : Form
    {
        public Dashboard()
        {
            InitializeComponent();

            RefreshDashboard();
        }

        private void OpenChildForm(Form childForm, string pageTitle)
        {
            if (activeForm != null)
            {
                pnlContent.Controls.Remove(activeForm);
                activeForm.Dispose();
            }

            activeForm = childForm;

            lblTitle.Text = pageTitle;

            tblDashboard.Visible = false;

            childForm.TopLevel = false;
            childForm.FormBorderStyle = FormBorderStyle.None;
            childForm.Dock = DockStyle.Fill;

            pnlContent.Controls.Add(childForm);
            pnlContent.Tag = childForm;

            childForm.BringToFront();
            childForm.Show();
        }

        public void ShowHome()
        {
            if (activeForm != null)
            {
                activeForm.Dispose();
                activeForm = null;
            }

            tblDashboard.Visible = true;

            lblTitle.Text = "MFC Youth NCR Central Database";

            RefreshDashboard();
        }

        private Form activeForm = null;

        private void RefreshDashboard()
        {
            LoadTotalMembers();
            LoadTotalChapters();
            LoadTotalServices();
            LoadTotalActivity();
        }
        private void ArrangeCards()
        {
            int gap = 30;
            int topMargin = 40;    
            int verticalGap = 30;  


            int totalTopWidth =
                cardMembers.Width +
                gap +
                cardChapters.Width;


            int startX = (pnlContent.ClientSize.Width - totalTopWidth) / 2;


            cardMembers.Location = new Point(startX, topMargin);


            cardChapters.Location = new Point(
                startX + cardMembers.Width + gap,
                topMargin);

            cardService.Location = new Point(
                (pnlContent.ClientSize.Width - cardService.Width) / 2,
                topMargin + cardMembers.Height + verticalGap);
        }

        private void LoadTotalMembers()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = "SELECT COUNT(*) FROM Member;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);

                    int totalMembers = Convert.ToInt32(cmd.ExecuteScalar());

                    lblTotalMembers.Text = totalMembers.ToString();
                }
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "Unable to load the dashboard statistics.",
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void LoadTotalChapters()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = "SELECT COUNT(*) FROM Chapter;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);

                    int totalChapters = Convert.ToInt32(cmd.ExecuteScalar());

                    lblTotalChapters.Text = totalChapters.ToString();
                }
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "Unable to load the dashboard statistics.",
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void LoadTotalServices()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = "SELECT COUNT(*) FROM Service;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);

                    int totalServices = Convert.ToInt32(cmd.ExecuteScalar());

                    lblTotalServices.Text = totalServices.ToString();
                }
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "Unable to load the dashboard statistics.",
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void LoadTotalActivity()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = "SELECT COUNT(*) FROM Activity;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);

                    int totalActivity = Convert.ToInt32(cmd.ExecuteScalar());

                    lblTotalActivity.Text = totalActivity.ToString();
                }
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "Unable to load the dashboard statistics.",
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void btnOpenMembers_Click(object sender, EventArgs e)
        {
            MembersForm membersForm = new MembersForm();
            membersForm.IsEmbedded = true;

            OpenChildForm(membersForm, "Members");
        }

        private void btnOpenChapters_Click(object sender, EventArgs e)
        {
            ChaptersForm chaptersForm = new ChaptersForm();
            chaptersForm.IsEmbedded = true;

            OpenChildForm(chaptersForm, "Chapters");
        }

        private void btnOpenService_Click(object sender, EventArgs e)
        {
            ServicesForm servicesForm = new ServicesForm();
            servicesForm.IsEmbedded = true;

            OpenChildForm(servicesForm, "Services");
        }

        private void Dashboard_Load(object sender, EventArgs e)
        {
            ArrangeCards();
        }

        private void btnOpenActivity_Click(object sender, EventArgs e)
        {
            ActivityForm activityForm = new ActivityForm();
            activityForm.IsEmbedded = true;

            OpenChildForm(activityForm, "Activity");
        }
    }
}