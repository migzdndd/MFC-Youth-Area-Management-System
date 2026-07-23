using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Data.SQLite;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Database.Forms
{
    public partial class ChapterMembersForm : Form
    {
        private readonly int chapterID;
        public ChapterMembersForm(int chapterID)
        {
            InitializeComponent();

            this.chapterID = chapterID;

            LoadChapter();
            LoadMembers();
        }
        private void LoadChapter()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                SELECT ChapterName
                FROM Chapter
                WHERE ChapterID = @ChapterID;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);

                    cmd.Parameters.AddWithValue("@ChapterID", chapterID);

                    object result = cmd.ExecuteScalar();

                    if (result != null)
                    {
                        lblChapterName.Text = result.ToString();
                    }
                    else
                    {
                        MessageBox.Show(
                            "The selected chapter could not be found.",
                            "Information",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);

                        Close();
                    }
                }
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "Unable to load the chapter information.",
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }
        private void LoadMembers(string keyword = "")
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();
                    string query = @"
SELECT *
FROM MemberDirectory
WHERE
    Chapter =
    (
        SELECT ChapterName
        FROM Chapter
        WHERE ChapterID = @ChapterID
    )
    AND
    (
        `Full Name` LIKE @keyword
        OR `Contact Number` LIKE @keyword
        OR `Email Address` LIKE @keyword
        OR Address LIKE @keyword
        OR Status LIKE @keyword
        OR Services LIKE @keyword
    )
ORDER BY `Full Name`;";
                    SQLiteDataAdapter adapter = new SQLiteDataAdapter(query, conn);
                    adapter.SelectCommand.Parameters.AddWithValue(
                        "@ChapterID",
                        chapterID);

                    adapter.SelectCommand.Parameters.AddWithValue(
                        "@keyword",
                        "%" + keyword + "%");
                    DataTable dt = new DataTable();

                    adapter.Fill(dt);

                    dgvMembers.DataSource = dt;

                    FormatDataGridView();
                }
            }
            catch (SQLiteException)
            {
                MessageBox.Show(
                    "Unable to load the chapter members.",
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "An unexpected error occurred.\n\nPlease try again.",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void FormatDataGridView()
        {
            if (dgvMembers.Columns.Contains("MemberID"))
            {
                dgvMembers.Columns["MemberID"].Visible = false;
            }

            if (dgvMembers.Columns.Contains("Age"))
            {
                dgvMembers.Columns["Age"].DefaultCellStyle.Alignment =
                    DataGridViewContentAlignment.MiddleCenter;

                dgvMembers.Columns["Age"].HeaderCell.Style.Alignment =
                    DataGridViewContentAlignment.MiddleCenter;
            }

            if (dgvMembers.Columns.Contains("Status"))
            {
                dgvMembers.Columns["Status"].DefaultCellStyle.Alignment =
                    DataGridViewContentAlignment.MiddleCenter;

                dgvMembers.Columns["Status"].HeaderCell.Style.Alignment =
                    DataGridViewContentAlignment.MiddleCenter;
            }

            dgvMembers.ReadOnly = true;

            dgvMembers.MultiSelect = false;

            dgvMembers.SelectionMode =
                DataGridViewSelectionMode.FullRowSelect;

            dgvMembers.AllowUserToAddRows = false;

            dgvMembers.AllowUserToDeleteRows = false;

            dgvMembers.AllowUserToResizeRows = false;

            dgvMembers.RowHeadersVisible = false;

            dgvMembers.AutoSizeColumnsMode =
                DataGridViewAutoSizeColumnsMode.Fill;
        }

        private void btnClose_Click(object sender, EventArgs e)
        {
            this.Close();
        }
    }
}
