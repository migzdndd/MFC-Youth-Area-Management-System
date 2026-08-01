using System;
using MFC_Youth_Database.Utilities;
using System.Windows.Forms;

namespace MFC_Youth_Database.Forms
{
    public partial class ChapterDialogForm : Form
    {
        public string ChapterName
        {
            get
            {
                return txtChapterName.Text.Trim();
            }
        }
        public ChapterDialogForm()
        {
            InitializeComponent();
        }

        private void btnCancel_Click(object sender, EventArgs e)
        {
            this.DialogResult = DialogResult.Cancel;
            Close();
        }

        private void btnCreate_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrWhiteSpace(txtChapterName.Text))
            {
                MessageBox.Show(
                    "Please enter a chapter name.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                txtChapterName.Focus();
                return;
            }

            if (txtChapterName.Text.Trim().Length > 50)
            {
                MessageBox.Show(
                    "Chapter name cannot exceed 50 characters.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                txtChapterName.Focus();
                return;
            }

            this.DialogResult = DialogResult.OK;
            Close();
        }
    }
}
