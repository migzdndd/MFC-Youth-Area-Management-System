using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using MFC_Youth_Database.Database;
using System.Data.SQLite;

namespace MFC_Youth_Database.Forms
{
    public partial class ChaptersForm : Form
    {
        public bool IsEmbedded { get; set; } = false;
        public ChaptersForm()
        {
            InitializeComponent();

            LoadChapters();
        }

        private void LoadChapters(string keyword = "")
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                SELECT
                    c.ChapterID,
                    c.ChapterName AS `Chapter`,
                    COUNT(m.MemberID) AS `Total Members`
                FROM Chapter c
                LEFT JOIN Member m
                    ON c.ChapterID = m.ChapterID
                WHERE c.ChapterName LIKE @keyword
                GROUP BY
                    c.ChapterID,
                    c.ChapterName
                ORDER BY c.ChapterName;";

                    SQLiteDataAdapter adapter = new SQLiteDataAdapter(query, conn);

                    adapter.SelectCommand.Parameters.AddWithValue(
                        "@keyword",
                        "%" + keyword + "%");

                    DataTable dt = new DataTable();

                    adapter.Fill(dt);

                    dgvChapters.DataSource = dt;

                    FormatDataGridView();
                }
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "Unable to load the chapter list.\n\nPlease try again.",
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void FormatDataGridView()
        {
            if (dgvChapters.Columns.Contains("ChapterID"))
            {
                dgvChapters.Columns["ChapterID"].Visible = false;
            }

            dgvChapters.ReadOnly = true;
            dgvChapters.MultiSelect = false;
            dgvChapters.SelectionMode = DataGridViewSelectionMode.FullRowSelect;

            dgvChapters.AllowUserToAddRows = false;
            dgvChapters.AllowUserToDeleteRows = false;
            dgvChapters.AllowUserToResizeRows = false;

            dgvChapters.RowHeadersVisible = false;
            dgvChapters.AutoSizeColumnsMode =
                DataGridViewAutoSizeColumnsMode.Fill;

            dgvChapters.Columns["Chapter"].FillWeight = 200;
            dgvChapters.Columns["Total Members"].FillWeight = 80;

            dgvChapters.Columns["Total Members"].DefaultCellStyle.Alignment =
                DataGridViewContentAlignment.MiddleCenter;

            dgvChapters.Columns["Total Members"].HeaderCell.Style.Alignment =
                DataGridViewContentAlignment.MiddleCenter;
        }

        private void dgvChapters_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex < 0)
            {
                return;
            }

            int chapterID = Convert.ToInt32(
                dgvChapters.Rows[e.RowIndex].Cells["ChapterID"].Value);

            using (ChapterMembersForm chapterMembersForm =
                new ChapterMembersForm(chapterID))
            {
                chapterMembersForm.ShowDialog();
            }
        }

        private void ChaptersForm_Shown(object sender, EventArgs e)
        {
            if (!IsEmbedded)
                return;

            panel1.Visible = false;
        }

        private void txtSearch_TextChanged(object sender, EventArgs e)
        {
            LoadChapters(txtSearch.Text.Trim());
        }

        private void btnRefresh_Click(object sender, EventArgs e)
        {
            txtSearch.Clear();

            LoadChapters();
        }

        private void btnManageChapter_Click(object sender, EventArgs e)
        {
            using (ManageChapterForm form = new ManageChapterForm())
            {
                form.ShowDialog();
            }

            LoadChapters();
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            if (this.ParentForm is Dashboard dashboard)
            {
                dashboard.ShowHome();
            }
        }

        private void tblActions_Paint(object sender, PaintEventArgs e)
        {

        }
    }
}
